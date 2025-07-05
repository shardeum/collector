import { jest } from '@jest/globals'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

// Mock WebSocket
jest.mock('ws')

describe('Connection Failures and Retry Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('WebSocket Connection Retry Logic', () => {
    test('should retry connection on failure', async () => {
      const maxRetries = 3
      const retryDelay = 1000
      let connectAttempts = 0

      class MockWebSocketClient extends EventEmitter {
        ws: WebSocket | null = null
        connected = false
        retryCount = 0

        async connect(url: string): Promise<void> {
          connectAttempts++
          
          if (connectAttempts <= 2) {
            // Fail first 2 attempts
            this.emit('error', new Error('Connection failed'))
            throw new Error('Connection failed')
          }
          
          // Succeed on 3rd attempt
          this.connected = true
          this.emit('open')
        }

        async connectWithRetry(url: string): Promise<void> {
          while (this.retryCount < maxRetries && !this.connected) {
            try {
              await this.connect(url)
              this.retryCount = 0 // Reset on success
            } catch (error) {
              this.retryCount++
              if (this.retryCount >= maxRetries) {
                throw new Error(`Failed after ${maxRetries} retries`)
              }
              // Use fake timer friendly delay
              await new Promise(resolve => {
                setTimeout(resolve, retryDelay)
                jest.advanceTimersByTime(retryDelay)
              })
            }
          }
        }
      }

      const client = new MockWebSocketClient()
      await client.connectWithRetry('ws://localhost:8080')
      
      expect(connectAttempts).toBe(3)
      expect(client.connected).toBe(true)
    })

    test('should handle exponential backoff', async () => {
      const delays: number[] = []
      
      function calculateBackoff(attempt: number): number {
        const baseDelay = 1000
        const maxDelay = 30000
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        delays.push(delay)
        return delay
      }

      // Test backoff calculation
      for (let i = 0; i < 6; i++) {
        calculateBackoff(i)
      }

      expect(delays).toEqual([
        1000,   // 1s
        2000,   // 2s
        4000,   // 4s
        8000,   // 8s
        16000,  // 16s
        30000   // 30s (capped)
      ])
    })

    test('should stop retrying after max attempts', async () => {
      const maxRetries = 3
      let connectAttempts = 0

      async function connectWithRetry(): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
          connectAttempts++
          
          // Always fail
          if (i < maxRetries - 1) {
            await new Promise(resolve => {
              setTimeout(resolve, 100)
              jest.advanceTimersByTime(100)
            })
          }
        }
        return false
      }

      const result = await connectWithRetry()
      
      expect(connectAttempts).toBe(3)
      expect(result).toBe(false)
    })

    test('should handle connection drops and reconnect', () => {
      class ReconnectingWebSocket extends EventEmitter {
        connected = false
        reconnectAttempts = 0
        maxReconnectAttempts = 5

        connect() {
          this.connected = true
          this.emit('connected')
        }

        disconnect() {
          this.connected = false
          this.emit('disconnected')
          this.scheduleReconnect()
        }

        scheduleReconnect() {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              this.connect()
            }, 1000 * this.reconnectAttempts)
          }
        }
      }

      const ws = new ReconnectingWebSocket()
      
      let connectedEvents = 0
      let disconnectedEvents = 0
      
      ws.on('connected', () => connectedEvents++)
      ws.on('disconnected', () => disconnectedEvents++)

      // Initial connection
      ws.connect()
      expect(ws.connected).toBe(true)
      expect(connectedEvents).toBe(1)

      // Simulate disconnect
      ws.disconnect()
      expect(ws.connected).toBe(false)
      expect(disconnectedEvents).toBe(1)

      // Should reconnect after delay
      jest.advanceTimersByTime(1000)
      expect(ws.connected).toBe(true)
      expect(connectedEvents).toBe(2)
    })
  })

  describe('HTTP Request Retry Logic', () => {
    test('should retry failed HTTP requests', async () => {
      let requestCount = 0
      
      async function makeRequestWithRetry(
        url: string,
        maxRetries: number = 3
      ): Promise<{ status: number; data: any }> {
        let lastError: Error | undefined
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            requestCount++
            
            // Simulate failures for first 2 attempts
            if (attempt < 2) {
              throw new Error('Network error')
            }
            
            // Success on 3rd attempt
            return { status: 200, data: { success: true } }
          } catch (error) {
            lastError = error as Error
            if (attempt === maxRetries) {
              throw lastError
            }
            // Continue to next attempt
          }
        }
        
        throw lastError || new Error('Max retries exceeded')
      }

      const result = await makeRequestWithRetry('/api/test')
      
      expect(requestCount).toBe(3)
      expect(result.status).toBe(200)
      expect(result.data.success).toBe(true)
    })

    test('should handle specific HTTP error codes', async () => {
      const retryableErrors = [500, 502, 503, 504] // Server errors
      const nonRetryableErrors = [400, 401, 403, 404] // Client errors

      function shouldRetry(statusCode: number): boolean {
        return retryableErrors.includes(statusCode)
      }

      // Test retryable errors
      retryableErrors.forEach(code => {
        expect(shouldRetry(code)).toBe(true)
      })

      // Test non-retryable errors
      nonRetryableErrors.forEach(code => {
        expect(shouldRetry(code)).toBe(false)
      })
    })

    test('should implement circuit breaker pattern', async () => {
      class CircuitBreaker {
        failureCount = 0
        failureThreshold = 5
        successThreshold = 2
        timeout = 60000 // 1 minute
        state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
        nextAttempt = 0
        successCount = 0

        async execute<T>(fn: () => Promise<T>): Promise<T> {
          if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
              throw new Error('Circuit breaker is OPEN')
            }
            this.state = 'HALF_OPEN'
          }

          try {
            const result = await fn()
            this.onSuccess()
            return result
          } catch (error) {
            this.onFailure()
            throw error
          }
        }

        onSuccess() {
          this.failureCount = 0
          
          if (this.state === 'HALF_OPEN') {
            this.successCount++
            if (this.successCount >= this.successThreshold) {
              this.state = 'CLOSED'
              this.successCount = 0
            }
          }
        }

        onFailure() {
          this.failureCount++
          this.successCount = 0
          
          if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN'
            this.nextAttempt = Date.now() + this.timeout
          }
        }
      }

      const breaker = new CircuitBreaker()
      
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Request failed')
          })
        } catch (e) {
          // Expected
        }
      }
      
      expect(breaker.state).toBe('OPEN')
      expect(breaker.failureCount).toBe(5)

      // Try to execute while open
      await expect(
        breaker.execute(async () => ({ data: 'test' }))
      ).rejects.toThrow('Circuit breaker is OPEN')
    })
  })

  describe('Connection Pool Management', () => {
    test('should manage connection pool size', () => {
      class ConnectionPool {
        connections: Array<{ id: number; inUse: boolean }> = []
        maxConnections = 10

        getConnection(): { id: number } | null {
          // Try to find an available connection
          const available = this.connections.find(c => !c.inUse)
          if (available) {
            available.inUse = true
            return available
          }

          // Create new connection if under limit
          if (this.connections.length < this.maxConnections) {
            const newConn = { id: this.connections.length, inUse: true }
            this.connections.push(newConn)
            return newConn
          }

          return null
        }

        releaseConnection(id: number) {
          const conn = this.connections.find(c => c.id === id)
          if (conn) {
            conn.inUse = false
          }
        }

        getActiveCount(): number {
          return this.connections.filter(c => c.inUse).length
        }
      }

      const pool = new ConnectionPool()
      const acquired = []

      // Acquire connections up to limit
      for (let i = 0; i < 10; i++) {
        const conn = pool.getConnection()
        expect(conn).not.toBeNull()
        acquired.push(conn)
      }

      // Should not create more than max
      const extra = pool.getConnection()
      expect(extra).toBeNull()
      expect(pool.connections.length).toBe(10)

      // Release some connections
      pool.releaseConnection(0)
      pool.releaseConnection(1)
      expect(pool.getActiveCount()).toBe(8)

      // Should reuse released connections
      const reused = pool.getConnection()
      expect(reused?.id).toBeLessThan(2)
    })

    test('should handle connection timeouts', async () => {
      class TimeoutManager {
        timeouts = new Map<string, NodeJS.Timeout>()

        setRequestTimeout(
          requestId: string,
          timeoutMs: number,
          onTimeout: () => void
        ) {
          const timeout = setTimeout(() => {
            this.timeouts.delete(requestId)
            onTimeout()
          }, timeoutMs)
          
          this.timeouts.set(requestId, timeout)
        }

        clearRequestTimeout(requestId: string) {
          const timeout = this.timeouts.get(requestId)
          if (timeout) {
            clearTimeout(timeout)
            this.timeouts.delete(requestId)
          }
        }
      }

      const manager = new TimeoutManager()
      let timedOut = false

      manager.setRequestTimeout('req1', 1000, () => {
        timedOut = true
      })

      // Should timeout after 1 second
      jest.advanceTimersByTime(1000)
      expect(timedOut).toBe(true)

      // Test clearing timeout
      timedOut = false
      manager.setRequestTimeout('req2', 1000, () => {
        timedOut = true
      })
      
      // Clear before timeout
      jest.advanceTimersByTime(500)
      manager.clearRequestTimeout('req2')
      jest.advanceTimersByTime(600)
      
      expect(timedOut).toBe(false)
    })
  })

  describe('Error Recovery Strategies', () => {
    test('should implement retry with jitter', () => {
      function calculateJitteredDelay(baseDelay: number, attempt: number): number {
        const exponentialDelay = baseDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 0.3 * exponentialDelay // 0-30% jitter
        return Math.floor(exponentialDelay + jitter)
      }

      // Test that jitter adds variation
      const delays = new Set<number>()
      for (let i = 0; i < 10; i++) {
        delays.add(calculateJitteredDelay(1000, 1))
      }

      // Should have multiple different values due to jitter
      expect(delays.size).toBeGreaterThan(1)
      
      // All values should be in expected range (2000-2600)
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(2000)
        expect(delay).toBeLessThanOrEqual(2600)
      })
    })

    test('should track connection health metrics', () => {
      class ConnectionHealthTracker {
        successCount = 0
        failureCount = 0
        totalLatency = 0
        requestCount = 0

        recordSuccess(latencyMs: number) {
          this.successCount++
          this.requestCount++
          this.totalLatency += latencyMs
        }

        recordFailure() {
          this.failureCount++
          this.requestCount++
        }

        getSuccessRate(): number {
          if (this.requestCount === 0) return 1
          return this.successCount / this.requestCount
        }

        getAverageLatency(): number {
          if (this.successCount === 0) return 0
          return this.totalLatency / this.successCount
        }

        isHealthy(minSuccessRate: number = 0.95): boolean {
          return this.getSuccessRate() >= minSuccessRate
        }
      }

      const tracker = new ConnectionHealthTracker()

      // Record some requests
      tracker.recordSuccess(100)
      tracker.recordSuccess(150)
      tracker.recordFailure()
      tracker.recordSuccess(200)

      expect(tracker.getSuccessRate()).toBeCloseTo(0.75)
      expect(tracker.getAverageLatency()).toBeCloseTo(150)
      expect(tracker.isHealthy(0.8)).toBe(false)
      expect(tracker.isHealthy(0.7)).toBe(true)
    })
  })
})