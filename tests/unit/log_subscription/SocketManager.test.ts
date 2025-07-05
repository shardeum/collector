import { SocketStream } from '@fastify/websocket'
import {
  addLogSocketClient,
  getLogSocketClient,
  removeLogSocketClient,
  logSubscriptionMap,
  addLogSubscriptions,
  removeLogSubscription,
  removeLogSubscriptionBySocketId,
} from '../../../src/log_subscription/SocketManager'

describe('SocketManager', () => {
  // Mock SocketStream
  const createMockSocket = (id: string): SocketStream => ({
    socket: {
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
  } as any)

  beforeEach(() => {
    // Clear all internal maps
    jest.clearAllMocks()
    logSubscriptionMap.clear()
    // Clear socket client map by removing all entries
    const socketIds = ['socket1', 'socket2', 'socket3']
    socketIds.forEach(id => removeLogSocketClient(id))
  })

  describe('Socket Client Management', () => {
    it('should add and retrieve socket clients', () => {
      const socketId = 'socket1'
      const mockSocket = createMockSocket(socketId)

      addLogSocketClient(socketId, mockSocket)
      const retrievedSocket = getLogSocketClient(socketId)

      expect(retrievedSocket).toBe(mockSocket)
    })

    it('should return undefined for non-existent socket', () => {
      const socket = getLogSocketClient('non-existent')
      expect(socket).toBeUndefined()
    })

    it('should remove socket clients', () => {
      const socketId = 'socket1'
      const mockSocket = createMockSocket(socketId)

      addLogSocketClient(socketId, mockSocket)
      removeLogSocketClient(socketId)
      const retrievedSocket = getLogSocketClient(socketId)

      expect(retrievedSocket).toBeUndefined()
    })

    it('should handle multiple socket clients', () => {
      const socket1 = createMockSocket('socket1')
      const socket2 = createMockSocket('socket2')

      addLogSocketClient('socket1', socket1)
      addLogSocketClient('socket2', socket2)

      expect(getLogSocketClient('socket1')).toBe(socket1)
      expect(getLogSocketClient('socket2')).toBe(socket2)
    })

    it('should overwrite existing socket with same ID', () => {
      const socketId = 'socket1'
      const socket1 = createMockSocket(socketId)
      const socket2 = createMockSocket(socketId)

      addLogSocketClient(socketId, socket1)
      addLogSocketClient(socketId, socket2)

      expect(getLogSocketClient(socketId)).toBe(socket2)
    })
  })

  describe('Log Subscription Management', () => {
    it('should add log subscriptions', () => {
      const subscriptionId = 'sub1'
      const socketId = 'socket1'
      const filterOptions = {
        address: ['0x123', '0x456'],
        topics: ['0xabc', '0xdef'],
      }

      addLogSubscriptions(subscriptionId, socketId, filterOptions)

      expect(logSubscriptionMap.has(subscriptionId)).toBe(true)
      const subscription = logSubscriptionMap.get(subscriptionId)
      expect(subscription).toEqual({
        subscriptionId,
        socketId,
        filterOptions,
      })
    })

    it('should handle subscriptions with empty filter options', () => {
      const subscriptionId = 'sub1'
      const socketId = 'socket1'
      const filterOptions = {
        address: [],
        topics: [],
      }

      addLogSubscriptions(subscriptionId, socketId, filterOptions)

      const subscription = logSubscriptionMap.get(subscriptionId)
      expect(subscription?.filterOptions.address).toEqual([])
      expect(subscription?.filterOptions.topics).toEqual([])
    })

    it('should overwrite existing subscription with same ID', () => {
      const subscriptionId = 'sub1'
      const filterOptions1 = { address: ['0x123'], topics: [] }
      const filterOptions2 = { address: ['0x456'], topics: ['0xabc'] }

      addLogSubscriptions(subscriptionId, 'socket1', filterOptions1)
      addLogSubscriptions(subscriptionId, 'socket2', filterOptions2)

      const subscription = logSubscriptionMap.get(subscriptionId)
      expect(subscription?.socketId).toBe('socket2')
      expect(subscription?.filterOptions).toEqual(filterOptions2)
    })

    it('should remove log subscriptions', () => {
      const subscriptionId = 'sub1'
      addLogSubscriptions(subscriptionId, 'socket1', { address: [], topics: [] })

      removeLogSubscription(subscriptionId)

      expect(logSubscriptionMap.has(subscriptionId)).toBe(false)
    })

    it('should handle removing non-existent subscription', () => {
      // Should not throw
      expect(() => removeLogSubscription('non-existent')).not.toThrow()
    })
  })

  describe('Socket-based Subscription Cleanup', () => {
    it('should remove socket and all its subscriptions', () => {
      const socketId = 'socket1'
      const mockSocket = createMockSocket(socketId)

      // Add socket
      addLogSocketClient(socketId, mockSocket)

      // Add multiple subscriptions for this socket
      addLogSubscriptions('sub1', socketId, { address: ['0x123'], topics: [] })
      addLogSubscriptions('sub2', socketId, { address: ['0x456'], topics: [] })
      addLogSubscriptions('sub3', 'socket2', { address: ['0x789'], topics: [] })

      removeLogSubscriptionBySocketId(socketId)

      // Socket should be removed
      expect(getLogSocketClient(socketId)).toBeUndefined()

      // Only subscriptions for this socket should be removed
      expect(logSubscriptionMap.has('sub1')).toBe(false)
      expect(logSubscriptionMap.has('sub2')).toBe(false)
      expect(logSubscriptionMap.has('sub3')).toBe(true)
    })

    it('should handle cleanup for socket with no subscriptions', () => {
      const socketId = 'socket1'
      const mockSocket = createMockSocket(socketId)

      addLogSocketClient(socketId, mockSocket)
      
      // Should not throw
      expect(() => removeLogSubscriptionBySocketId(socketId)).not.toThrow()
      expect(getLogSocketClient(socketId)).toBeUndefined()
    })

    it('should handle cleanup for non-existent socket', () => {
      // Should not throw
      expect(() => removeLogSubscriptionBySocketId('non-existent')).not.toThrow()
    })

    it('should handle concurrent subscriptions across multiple sockets', () => {
      // Setup multiple sockets with overlapping subscriptions
      addLogSocketClient('socket1', createMockSocket('socket1'))
      addLogSocketClient('socket2', createMockSocket('socket2'))

      addLogSubscriptions('sub1', 'socket1', { address: ['0x111'], topics: [] })
      addLogSubscriptions('sub2', 'socket1', { address: ['0x222'], topics: [] })
      addLogSubscriptions('sub3', 'socket2', { address: ['0x333'], topics: [] })
      addLogSubscriptions('sub4', 'socket2', { address: ['0x444'], topics: [] })

      // Remove socket1
      removeLogSubscriptionBySocketId('socket1')

      // Verify socket1 and its subscriptions are gone
      expect(getLogSocketClient('socket1')).toBeUndefined()
      expect(logSubscriptionMap.has('sub1')).toBe(false)
      expect(logSubscriptionMap.has('sub2')).toBe(false)

      // Verify socket2 and its subscriptions remain
      expect(getLogSocketClient('socket2')).toBeDefined()
      expect(logSubscriptionMap.has('sub3')).toBe(true)
      expect(logSubscriptionMap.has('sub4')).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle subscription with undefined filter properties', () => {
      const filterOptions = {
        address: undefined as any,
        topics: undefined as any,
      }

      addLogSubscriptions('sub1', 'socket1', filterOptions)

      const subscription = logSubscriptionMap.get('sub1')
      expect(subscription?.filterOptions).toEqual(filterOptions)
    })

    it('should handle large number of subscriptions', () => {
      const socketId = 'socket1'
      addLogSocketClient(socketId, createMockSocket(socketId))

      // Add 1000 subscriptions
      for (let i = 0; i < 1000; i++) {
        addLogSubscriptions(`sub${i}`, socketId, {
          address: [`0x${i}`],
          topics: [`0xtopic${i}`],
        })
      }

      expect(logSubscriptionMap.size).toBe(1000)

      // Remove all subscriptions by socket
      removeLogSubscriptionBySocketId(socketId)

      expect(logSubscriptionMap.size).toBe(0)
    })

    it('should maintain subscription integrity during concurrent operations', () => {
      const socketId = 'socket1'
      
      // Simulate concurrent adds and removes
      for (let i = 0; i < 10; i++) {
        addLogSubscriptions(`sub${i}`, socketId, { address: [], topics: [] })
      }

      // Remove some subscriptions while adding others
      removeLogSubscription('sub3')
      addLogSubscriptions('sub10', socketId, { address: ['0xnew'], topics: [] })
      removeLogSubscription('sub7')

      expect(logSubscriptionMap.has('sub3')).toBe(false)
      expect(logSubscriptionMap.has('sub7')).toBe(false)
      expect(logSubscriptionMap.has('sub10')).toBe(true)
      expect(logSubscriptionMap.size).toBe(9) // 10 - 2 removed + 1 added
    })
  })
})