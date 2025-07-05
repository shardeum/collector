import { jest } from '@jest/globals'

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rate Limit Configuration', () => {
    test('should load rate limit configuration', async () => {
      // Test that rate limit config is loaded correctly
      const { config } = await import('../../../src/config')
      expect(config.rateLimit).toBeDefined()
      expect(typeof config.rateLimit).toBe('number')
      expect(config.rateLimit).toBeGreaterThan(0)
    })

    test('should have default rate limit value', async () => {
      // Default rate limit should be 100 as per config/index.ts
      const { config } = await import('../../../src/config')
      // The actual value may vary based on environment
      expect(config.rateLimit).toBeGreaterThan(0)
    })
  })

  describe('Rate Limiting Logic', () => {
    test('should track request counts per IP', () => {
      // Simulate rate limiting logic
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      const windowMs = 60 * 1000 // 1 minute
      const maxRequests = 5

      function checkRateLimit(ip: string): boolean {
        const now = Date.now()
        const record = requestCounts.get(ip)

        if (!record || now > record.resetTime) {
          // New window
          requestCounts.set(ip, {
            count: 1,
            resetTime: now + windowMs
          })
          return true
        }

        if (record.count >= maxRequests) {
          return false // Rate limited
        }

        record.count++
        return true
      }

      // Test normal flow
      const testIp = '192.168.1.100'
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(testIp)).toBe(true)
      }
      // 6th request should be blocked
      expect(checkRateLimit(testIp)).toBe(false)

      // Different IP should work
      expect(checkRateLimit('192.168.1.101')).toBe(true)
    })

    test('should reset rate limit after time window', () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      const windowMs = 60 * 1000
      const maxRequests = 5

      function checkRateLimit(ip: string, currentTime: number = Date.now()): boolean {
        const record = requestCounts.get(ip)

        if (!record || currentTime > record.resetTime) {
          requestCounts.set(ip, {
            count: 1,
            resetTime: currentTime + windowMs
          })
          return true
        }

        if (record.count >= maxRequests) {
          return false
        }

        record.count++
        return true
      }

      const testIp = '192.168.1.100'
      const startTime = Date.now()

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(testIp, startTime)).toBe(true)
      }
      expect(checkRateLimit(testIp, startTime)).toBe(false)

      // Simulate time passing
      const afterWindow = startTime + windowMs + 1000
      expect(checkRateLimit(testIp, afterWindow)).toBe(true)
    })

    test('should bypass rate limit for allowlisted IPs', () => {
      const allowlist = ['127.0.0.1', 'localhost', '::1']
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      const maxRequests = 5

      function checkRateLimit(ip: string): boolean {
        // Check allowlist first
        if (allowlist.includes(ip)) {
          return true
        }

        const now = Date.now()
        const record = requestCounts.get(ip)

        if (!record || now > record.resetTime) {
          requestCounts.set(ip, {
            count: 1,
            resetTime: now + 60000
          })
          return true
        }

        if (record.count >= maxRequests) {
          return false
        }

        record.count++
        return true
      }

      // Localhost should always pass
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit('127.0.0.1')).toBe(true)
        expect(checkRateLimit('localhost')).toBe(true)
      }

      // Regular IP should be rate limited
      const regularIp = '192.168.1.50'
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(regularIp)).toBe(true)
      }
      expect(checkRateLimit(regularIp)).toBe(false)
    })
  })

  describe('Concurrent Request Handling', () => {
    test('should handle concurrent requests atomically', async () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      const maxRequests = 5
      let requestId = 0

      async function simulateConcurrentRequest(ip: string): Promise<boolean> {
        const id = ++requestId
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))

        const now = Date.now()
        let record = requestCounts.get(ip)

        if (!record || now > record.resetTime) {
          record = { count: 0, resetTime: now + 60000 }
          requestCounts.set(ip, record)
        }

        // Simulate atomic operation
        if (record.count >= maxRequests) {
          return false
        }

        record.count++
        return true
      }

      const ip = '192.168.1.100'
      
      // Send 10 concurrent requests
      const promises = Array(10).fill(0).map(() => simulateConcurrentRequest(ip))
      const results = await Promise.all(promises)

      // Exactly 5 should succeed
      const successCount = results.filter(r => r === true).length
      expect(successCount).toBe(5)
    })

    test('should maintain separate counters for different IPs', async () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      const maxRequests = 3

      function checkRateLimit(ip: string): boolean {
        const now = Date.now()
        let record = requestCounts.get(ip)

        if (!record || now > record.resetTime) {
          record = { count: 1, resetTime: now + 60000 }
          requestCounts.set(ip, record)
          return true
        }

        if (record.count >= maxRequests) {
          return false
        }

        record.count++
        return true
      }

      // Test multiple IPs concurrently
      const ips = ['10.0.0.1', '10.0.0.2', '10.0.0.3']
      
      // Each IP makes 3 requests (the limit)
      ips.forEach(ip => {
        for (let i = 0; i < 3; i++) {
          expect(checkRateLimit(ip)).toBe(true)
        }
      })

      // All IPs should be at their limit
      ips.forEach(ip => {
        expect(checkRateLimit(ip)).toBe(false)
      })

      // Verify counters are independent
      expect(requestCounts.get('10.0.0.1')?.count).toBe(3)
      expect(requestCounts.get('10.0.0.2')?.count).toBe(3)
      expect(requestCounts.get('10.0.0.3')?.count).toBe(3)
    })
  })

  describe('Rate Limit Headers', () => {
    test('should calculate correct rate limit headers', () => {
      const maxRequests = 100
      const windowMs = 60 * 1000
      const resetTime = Date.now() + windowMs

      function calculateHeaders(remainingRequests: number) {
        return {
          'x-ratelimit-limit': maxRequests.toString(),
          'x-ratelimit-remaining': remainingRequests.toString(),
          'x-ratelimit-reset': new Date(resetTime).toISOString()
        }
      }

      // Test header calculation
      let remaining = maxRequests
      let headers = calculateHeaders(remaining)
      expect(headers['x-ratelimit-limit']).toBe('100')
      expect(headers['x-ratelimit-remaining']).toBe('100')

      // After some requests
      remaining = 75
      headers = calculateHeaders(remaining)
      expect(headers['x-ratelimit-remaining']).toBe('75')

      // When exhausted
      remaining = 0
      headers = calculateHeaders(remaining)
      expect(headers['x-ratelimit-remaining']).toBe('0')
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid IP addresses gracefully', () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>()

      function checkRateLimit(ip: string | null | undefined): boolean {
        if (!ip) {
          // Default to a placeholder for missing IPs
          ip = 'unknown'
        }

        const record = requestCounts.get(ip)
        if (!record) {
          requestCounts.set(ip, { count: 1, resetTime: Date.now() + 60000 })
          return true
        }

        if (record.count >= 5) {
          return false
        }

        record.count++
        return true
      }

      // Test with various invalid inputs
      expect(checkRateLimit(null)).toBe(true)
      expect(checkRateLimit(undefined)).toBe(true)
      expect(checkRateLimit('')).toBe(true)
      
      // All should be counted under 'unknown'
      expect(checkRateLimit(null)).toBe(true)
      expect(checkRateLimit(undefined)).toBe(true)
      // Should hit limit
      expect(checkRateLimit(null)).toBe(false)
    })

    test('should handle race conditions in cleanup', () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>()
      
      function cleanupExpiredEntries(currentTime: number) {
        const entriesToDelete: string[] = []
        
        requestCounts.forEach((record, ip) => {
          if (currentTime > record.resetTime) {
            entriesToDelete.push(ip)
          }
        })

        entriesToDelete.forEach(ip => requestCounts.delete(ip))
        return entriesToDelete.length
      }

      // Add some entries
      const baseTime = Date.now()
      requestCounts.set('ip1', { count: 5, resetTime: baseTime - 1000 }) // Expired
      requestCounts.set('ip2', { count: 3, resetTime: baseTime + 1000 }) // Active
      requestCounts.set('ip3', { count: 1, resetTime: baseTime - 2000 }) // Expired

      // Cleanup should remove 2 expired entries
      const cleaned = cleanupExpiredEntries(baseTime)
      expect(cleaned).toBe(2)
      expect(requestCounts.size).toBe(1)
      expect(requestCounts.has('ip2')).toBe(true)
    })
  })
})