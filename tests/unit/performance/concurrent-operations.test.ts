import { jest } from '@jest/globals'
import { EventEmitter } from 'events'

describe('Concurrent Operations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Concurrent Read/Write Operations', () => {
    test('should handle concurrent reads without blocking', async () => {
      class ConcurrentStore {
        private data = new Map<string, any>()
        private readCount = 0

        async read(key: string): Promise<any> {
          this.readCount++
          // Simulate async read operation
          await new Promise(resolve => setImmediate(resolve))
          return this.data.get(key)
        }

        write(key: string, value: any) {
          this.data.set(key, value)
        }

        getReadCount(): number {
          return this.readCount
        }
      }

      const store = new ConcurrentStore()
      store.write('key1', 'value1')
      store.write('key2', 'value2')
      store.write('key3', 'value3')

      // Perform concurrent reads
      const readPromises = []
      for (let i = 0; i < 10; i++) {
        readPromises.push(
          store.read('key1'),
          store.read('key2'),
          store.read('key3')
        )
      }

      const results = await Promise.all(readPromises)
      
      expect(results.filter(r => r === 'value1')).toHaveLength(10)
      expect(results.filter(r => r === 'value2')).toHaveLength(10)
      expect(results.filter(r => r === 'value3')).toHaveLength(10)
      expect(store.getReadCount()).toBe(30)
    })

    test('should handle read-write conflicts with locks', async () => {
      class LockingStore {
        private data = new Map<string, any>()
        private locks = new Map<string, Promise<void>>()
        private lockQueue = new Map<string, (() => void)[]>()

        async acquireLock(key: string): Promise<() => void> {
          while (this.locks.has(key)) {
            await new Promise<void>(resolve => {
              if (!this.lockQueue.has(key)) {
                this.lockQueue.set(key, [])
              }
              this.lockQueue.get(key)!.push(resolve)
            })
          }

          let releaseLock: () => void
          const lockPromise = new Promise<void>(resolve => {
            releaseLock = () => {
              this.locks.delete(key)
              const queue = this.lockQueue.get(key)
              if (queue && queue.length > 0) {
                const next = queue.shift()!
                next()
              }
              resolve()
            }
          })

          this.locks.set(key, lockPromise)
          return releaseLock!
        }

        async write(key: string, value: any): Promise<void> {
          const release = await this.acquireLock(key)
          try {
            // Simulate write delay
            await new Promise(resolve => setTimeout(resolve, 10))
            this.data.set(key, value)
          } finally {
            release()
          }
        }

        async read(key: string): Promise<any> {
          // Reads don't need locks in this implementation
          return this.data.get(key)
        }
      }

      const store = new LockingStore()
      const writeResults: string[] = []

      // Concurrent writes to same key
      const writePromises = []
      for (let i = 0; i < 5; i++) {
        writePromises.push(
          store.write('key1', `value${i}`).then(() => {
            writeResults.push(`write${i}`)
          })
        )
      }

      await Promise.all(writePromises)

      // All writes should complete
      expect(writeResults).toHaveLength(5)
      
      // Final value should be from one of the writes
      const finalValue = await store.read('key1')
      expect(finalValue).toMatch(/^value[0-4]$/)
    })

    test('should implement optimistic concurrency control', async () => {
      interface VersionedData {
        value: any
        version: number
      }

      class OptimisticStore {
        private data = new Map<string, VersionedData>()

        read(key: string): VersionedData | undefined {
          return this.data.get(key)
        }

        write(key: string, value: any, expectedVersion?: number): boolean {
          const current = this.data.get(key)
          
          if (expectedVersion !== undefined) {
            // Check version for update
            if (!current || current.version !== expectedVersion) {
              return false // Version mismatch
            }
          }

          const newVersion = current ? current.version + 1 : 1
          this.data.set(key, { value, version: newVersion })
          return true
        }
      }

      const store = new OptimisticStore()
      
      // Initial write
      expect(store.write('key1', 'initial')).toBe(true)
      
      // Read current version
      const v1 = store.read('key1')
      expect(v1?.version).toBe(1)
      
      // Concurrent updates
      const update1 = store.write('key1', 'update1', 1)
      const update2 = store.write('key1', 'update2', 1)
      
      // Only one should succeed
      expect(update1).toBe(true)
      expect(update2).toBe(false)
      
      // Verify final state
      const final = store.read('key1')
      expect(final?.value).toBe('update1')
      expect(final?.version).toBe(2)
    })
  })

  describe('Thread Pool Simulation', () => {
    test('should manage worker pool for concurrent tasks', async () => {
      class WorkerPool {
        private workers: Worker[] = []
        private taskQueue: Array<{ task: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = []
        private busyWorkers = new Set<Worker>()

        constructor(private poolSize: number) {
          for (let i = 0; i < poolSize; i++) {
            this.workers.push(new Worker(i))
          }
        }

        async execute<T>(task: () => Promise<T>): Promise<T> {
          return new Promise((resolve, reject) => {
            this.taskQueue.push({ task, resolve, reject })
            this.processQueue()
          })
        }

        private async processQueue() {
          const availableWorker = this.workers.find(w => !this.busyWorkers.has(w))
          if (!availableWorker || this.taskQueue.length === 0) return

          const { task, resolve, reject } = this.taskQueue.shift()!
          this.busyWorkers.add(availableWorker)

          try {
            const result = await availableWorker.run(task)
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            this.busyWorkers.delete(availableWorker)
            this.processQueue() // Process next task
          }
        }

        getStats() {
          return {
            total: this.workers.length,
            busy: this.busyWorkers.size,
            queued: this.taskQueue.length
          }
        }
      }

      class Worker {
        constructor(private id: number) {}

        async run<T>(task: () => Promise<T>): Promise<T> {
          // Simulate task execution
          return await task()
        }
      }

      const pool = new WorkerPool(3)
      const results: number[] = []

      // Submit more tasks than workers
      const tasks = []
      for (let i = 0; i < 10; i++) {
        tasks.push(
          pool.execute(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            results.push(i)
            return i
          })
        )
      }

      const taskResults = await Promise.all(tasks)
      
      expect(taskResults).toHaveLength(10)
      expect(results).toHaveLength(10)
      expect(new Set(results).size).toBe(10) // All unique values
    })

    test('should handle task priorities', async () => {
      interface PriorityTask {
        priority: number
        id: string
        execute: () => Promise<any>
      }

      class PriorityQueue<T> {
        private items: T[] = []

        enqueue(item: T, priority: number) {
          const element = { item, priority }
          let added = false

          for (let i = 0; i < this.items.length; i++) {
            if ((this.items[i] as any).priority < priority) {
              this.items.splice(i, 0, element as any)
              added = true
              break
            }
          }

          if (!added) {
            this.items.push(element as any)
          }
        }

        dequeue(): T | undefined {
          const element = this.items.shift()
          return element ? (element as any).item : undefined
        }

        size(): number {
          return this.items.length
        }
      }

      const queue = new PriorityQueue<PriorityTask>()
      const executionOrder: string[] = []

      // Add tasks with different priorities
      queue.enqueue(
        { priority: 1, id: 'low', execute: async () => executionOrder.push('low') },
        1
      )
      queue.enqueue(
        { priority: 5, id: 'high', execute: async () => executionOrder.push('high') },
        5
      )
      queue.enqueue(
        { priority: 3, id: 'medium', execute: async () => executionOrder.push('medium') },
        3
      )

      // Execute in priority order
      while (queue.size() > 0) {
        const task = queue.dequeue()
        if (task) {
          await task.execute()
        }
      }

      expect(executionOrder).toEqual(['high', 'medium', 'low'])
    })
  })

  describe('Resource Contention', () => {
    test('should handle database connection pool exhaustion', async () => {
      class SimpleConnectionPool {
        private connections: number = 0
        private maxConnections: number
        private waiting: number = 0

        constructor(maxConnections: number) {
          this.maxConnections = maxConnections
        }

        async getConnection(): Promise<{ release: () => void } | null> {
          if (this.connections < this.maxConnections) {
            this.connections++
            return {
              release: () => {
                this.connections--
                this.waiting = Math.max(0, this.waiting - 1)
              }
            }
          }

          // Pool exhausted
          this.waiting++
          return null
        }

        getStats() {
          return {
            active: this.connections,
            waiting: this.waiting,
            available: this.maxConnections - this.connections
          }
        }
      }

      const pool = new SimpleConnectionPool(2)

      // Get all available connections
      const conn1 = await pool.getConnection()
      const conn2 = await pool.getConnection()
      
      expect(pool.getStats().active).toBe(2)
      expect(pool.getStats().available).toBe(0)

      // Third request should fail (pool exhausted)
      const conn3 = await pool.getConnection()
      expect(conn3).toBeNull()
      expect(pool.getStats().waiting).toBe(1)

      // Release one connection
      conn1!.release()
      expect(pool.getStats().active).toBe(1)
      expect(pool.getStats().available).toBe(1)

      // Now we can get another connection
      const conn4 = await pool.getConnection()
      expect(conn4).not.toBeNull()
      expect(pool.getStats().active).toBe(2)

      // Cleanup
      conn2!.release()
      conn4!.release()
      expect(pool.getStats().active).toBe(0)
    })

    test('should prevent deadlocks with ordered locking', async () => {
      class OrderedLockManager {
        private locks = new Map<string, { order: number; holders: Set<string> }>()
        private lockOrder = new Map<string, number>()
        private nextOrder = 0

        registerResource(resourceId: string) {
          if (!this.lockOrder.has(resourceId)) {
            this.lockOrder.set(resourceId, this.nextOrder++)
          }
        }

        async acquireMultiple(
          holderId: string,
          resourceIds: string[]
        ): Promise<() => void> {
          // Sort resources by lock order to prevent deadlocks
          const sortedIds = [...resourceIds].sort((a, b) => {
            const orderA = this.lockOrder.get(a) ?? Infinity
            const orderB = this.lockOrder.get(b) ?? Infinity
            return orderA - orderB
          })

          const acquired: string[] = []

          try {
            for (const resourceId of sortedIds) {
              await this.acquireSingle(holderId, resourceId)
              acquired.push(resourceId)
            }

            return () => {
              for (const resourceId of acquired) {
                this.release(holderId, resourceId)
              }
            }
          } catch (error) {
            // Release any acquired locks on error
            for (const resourceId of acquired) {
              this.release(holderId, resourceId)
            }
            throw error
          }
        }

        private async acquireSingle(holderId: string, resourceId: string): Promise<void> {
          while (true) {
            const lock = this.locks.get(resourceId)
            if (!lock || lock.holders.size === 0) {
              // Acquire lock
              if (!lock) {
                this.locks.set(resourceId, {
                  order: this.lockOrder.get(resourceId) ?? 0,
                  holders: new Set([holderId])
                })
              } else {
                lock.holders.add(holderId)
              }
              return
            }
            // Wait a bit and retry
            await new Promise(resolve => setImmediate(resolve))
          }
        }

        private release(holderId: string, resourceId: string) {
          const lock = this.locks.get(resourceId)
          if (lock) {
            lock.holders.delete(holderId)
          }
        }
      }

      const lockManager = new OrderedLockManager()
      lockManager.registerResource('A')
      lockManager.registerResource('B')
      lockManager.registerResource('C')

      const results: string[] = []

      // Two processes trying to acquire locks in different orders
      const process1 = async () => {
        const release = await lockManager.acquireMultiple('p1', ['B', 'A']) // Will be sorted to A, B
        results.push('p1_acquired')
        await new Promise(resolve => setTimeout(resolve, 10))
        release()
        results.push('p1_released')
      }

      const process2 = async () => {
        const release = await lockManager.acquireMultiple('p2', ['A', 'B']) // Already in order
        results.push('p2_acquired')
        await new Promise(resolve => setTimeout(resolve, 10))
        release()
        results.push('p2_released')
      }

      // Run concurrently - should not deadlock
      await Promise.all([process1(), process2()])

      expect(results).toHaveLength(4)
      expect(results).toContain('p1_acquired')
      expect(results).toContain('p2_acquired')
    })
  })

  describe('Concurrent Data Structures', () => {
    test('should implement thread-safe counter', () => {
      class AtomicCounter {
        private value = 0
        private operations: Array<{ type: 'increment' | 'decrement'; amount: number }> = []

        increment(amount: number = 1): number {
          this.operations.push({ type: 'increment', amount })
          this.value += amount
          return this.value
        }

        decrement(amount: number = 1): number {
          this.operations.push({ type: 'decrement', amount })
          this.value -= amount
          return this.value
        }

        get(): number {
          return this.value
        }

        getOperationCount(): number {
          return this.operations.length
        }
      }

      const counter = new AtomicCounter()
      
      // Simulate concurrent increments
      const increments = 100
      for (let i = 0; i < increments; i++) {
        counter.increment()
      }

      expect(counter.get()).toBe(100)
      expect(counter.getOperationCount()).toBe(100)

      // Simulate concurrent decrements
      for (let i = 0; i < 50; i++) {
        counter.decrement()
      }

      expect(counter.get()).toBe(50)
      expect(counter.getOperationCount()).toBe(150)
    })

    test('should implement concurrent queue with backpressure', async () => {
      class BoundedQueue<T> extends EventEmitter {
        private items: T[] = []
        private maxSize: number
        private closed = false

        constructor(maxSize: number) {
          super()
          this.maxSize = maxSize
        }

        async enqueue(item: T): Promise<boolean> {
          if (this.closed) return false

          while (this.items.length >= this.maxSize) {
            // Wait for space
            await new Promise<void>(resolve => {
              this.once('dequeued', resolve)
            })
            if (this.closed) return false
          }

          this.items.push(item)
          this.emit('enqueued')
          return true
        }

        dequeue(): T | undefined {
          const item = this.items.shift()
          if (item !== undefined) {
            this.emit('dequeued')
          }
          return item
        }

        size(): number {
          return this.items.length
        }

        close() {
          this.closed = true
          this.emit('dequeued') // Wake up waiting enqueuers
        }
      }

      const queue = new BoundedQueue<number>(3)
      const enqueueResults: boolean[] = []

      // Fill the queue
      await queue.enqueue(1)
      await queue.enqueue(2)
      await queue.enqueue(3)

      // This should block until space is available
      const enqueuePromise = queue.enqueue(4).then(result => {
        enqueueResults.push(result)
        return result
      })

      // Verify queue is full
      expect(queue.size()).toBe(3)

      // Dequeue to make space
      const item = queue.dequeue()
      expect(item).toBe(1)

      // Now the blocked enqueue should complete
      await enqueuePromise
      expect(enqueueResults).toEqual([true])
      expect(queue.size()).toBe(3)

      // Test closing
      queue.close()
      const closedResult = await queue.enqueue(5)
      expect(closedResult).toBe(false)
    })
  })
})