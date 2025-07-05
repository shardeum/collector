import * as socketClient from 'socket.io-client'
import { setupCollectorListener } from '../../../src/log_subscription/CollectorListener'
import * as CollectorDataParser from '../../../src/log_subscription/CollectorDataParser'
import * as SocketManager from '../../../src/log_subscription/SocketManager'
import { newHeadsSubscribers } from '../../../src/log_server'
import { config } from '../../../src/config'

// Mock dependencies
jest.mock('socket.io-client')
jest.mock('../../../src/log_subscription/CollectorDataParser')
jest.mock('../../../src/log_subscription/SocketManager')
jest.mock('../../../src/log_server', () => ({
  newHeadsSubscribers: new Set(),
}))
jest.mock('../../../src/config', () => ({
  config: {
    host: 'localhost',
    port: {
      collector: 3000,
    },
  },
}))

describe('CollectorListener', () => {
  let mockSocket: any
  let socketEventHandlers: Map<string, Function>

  beforeEach(() => {
    jest.clearAllMocks()
    socketEventHandlers = new Map()
    
    // Create mock socket
    mockSocket = {
      on: jest.fn((event: string, handler: Function) => {
        socketEventHandlers.set(event, handler)
      }),
      connect: jest.fn(),
      disconnect: jest.fn(),
    }

    // Mock socket.io-client connect
    const mockedSocketClient = socketClient as jest.Mocked<typeof socketClient>
    mockedSocketClient.connect.mockReturnValue(mockSocket)

    // Clear newHeadsSubscribers
    newHeadsSubscribers.clear()
  })

  describe('Setup and Connection', () => {
    it('should connect to collector with correct URL and options', async () => {
      await setupCollectorListener()

      expect(socketClient.connect).toHaveBeenCalledWith(
        `http://${config.host}:${config.port.collector}`,
        {
          reconnection: true,
          reconnectionAttempts: 10,
        }
      )
    })

    it('should register all required event handlers', async () => {
      await setupCollectorListener()

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('/data/cycle', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('/data/receipt', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('/data/block', expect.any(Function))
    })

    it('should handle connection events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await setupCollectorListener()

      // Trigger connect event
      socketEventHandlers.get('connect')!()
      expect(consoleSpy).toHaveBeenCalledWith('Connected to collector')

      // Trigger disconnect event
      socketEventHandlers.get('disconnect')!()
      expect(consoleSpy).toHaveBeenCalledWith('Disconnected from collector')

      // Trigger error event
      const error = new Error('Test error')
      socketEventHandlers.get('error')!(error)
      expect(consoleSpy).toHaveBeenCalledWith(`Error from collector: ${error}`)

      consoleSpy.mockRestore()
    })
  })

  describe('Cycle Data Handler', () => {
    it('should handle valid cycle data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      const cycleData = [{
        cycleRecord: {
          counter: 1,
          cycleMarker: '0x123',
        },
      }]

      const handler = socketEventHandlers.get('/data/cycle')!
      await handler(cycleData)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Received archived cycle data, valid? ',
        1  // The check evaluates to 1 (truthy) not true
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        `Cycle data: ${JSON.stringify(cycleData, null, 2)}`
      )

      consoleSpy.mockRestore()
    })

    it('should handle invalid cycle data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      const testCases = [
        { data: null, expected: null },
        { data: undefined, expected: undefined },
        { data: [], expected: undefined },
        { data: [{}], expected: undefined },
        { data: [{ cycleRecord: {} }], expected: undefined },
      ]

      for (const { data, expected } of testCases) {
        const handler = socketEventHandlers.get('/data/cycle')!
        await handler(data)

        expect(consoleSpy).toHaveBeenCalledWith(
          'Received archived cycle data, valid? ',
          expected
        )
        consoleSpy.mockClear()
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Receipt Data Handler', () => {
    let mockIndexedLogs: any
    let mockLogSocketClient: any

    beforeEach(() => {
      // Mock IndexedLogs class
      mockIndexedLogs = {
        filter: jest.fn(),
      }
      const mockedParser = CollectorDataParser as jest.Mocked<typeof CollectorDataParser>
      mockedParser.IndexedLogs = jest.fn().mockImplementation(() => mockIndexedLogs)
      mockedParser.extractLogsFromReceipts.mockReset()

      // Mock socket client
      mockLogSocketClient = {
        socket: {
          send: jest.fn(),
        },
      }
      const mockedSocketManager = SocketManager as jest.Mocked<typeof SocketManager>
      mockedSocketManager.getLogSocketClient.mockReset()
      // @ts-ignore - accessing internal map for testing
      SocketManager.logSubscriptionMap.clear()
    })

    it('should process receipts with logs and send to subscribers', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      // Setup test data
      const receipts = [{ id: 'receipt1' }, { id: 'receipt2' }]
      const logs = [
        {
          address: '0x123',
          blockHash: '0xblock1',
          blockNumber: '0x1',
          data: '0xdata',
          logIndex: '0x0',
          transactionHash: '0xtx1',
          transactionIndex: '0x0',
          topics: ['0xtopic1'],
        },
        {
          address: '0x456',
          blockHash: '0xblock2',
          blockNumber: '0x2',
          data: '0xdata2',
          logIndex: '0x1',
          transactionHash: '0xtx2',
          transactionIndex: '0x1',
          topics: ['0xtopic2'],
        },
      ]
      const filteredLogs = [logs[0]]

      // Mock extractLogsFromReceipts
      const mockedParser = CollectorDataParser as jest.Mocked<typeof CollectorDataParser>
      mockedParser.extractLogsFromReceipts.mockReturnValue(logs)

      // Setup subscription
      const subscription = {
        subscriptionId: 'sub1',
        socketId: 'socket1',
        filterOptions: { address: ['0x123'], topics: [] },
      }
      SocketManager.logSubscriptionMap.set('sub1', subscription)

      // Mock filter result
      mockIndexedLogs.filter.mockReturnValue(filteredLogs)

      // Mock socket client
      const mockedSocketManager = SocketManager as jest.Mocked<typeof SocketManager>
      mockedSocketManager.getLogSocketClient.mockReturnValue(mockLogSocketClient)

      // Execute handler
      const handler = socketEventHandlers.get('/data/receipt')!
      await handler(receipts)

      // Verify logs extraction
      expect(mockedParser.extractLogsFromReceipts).toHaveBeenCalledWith(receipts)
      expect(consoleSpy).toHaveBeenCalledWith('Received receipt data from archiver.')
      expect(consoleSpy).toHaveBeenCalledWith(`Number of logs found in receipts: ${logs.length}`)

      // Verify IndexedLogs creation
      expect(mockedParser.IndexedLogs).toHaveBeenCalledWith(logs)

      // Verify filtering
      expect(mockIndexedLogs.filter).toHaveBeenCalledWith(subscription.filterOptions)
      expect(consoleSpy).toHaveBeenCalledWith(
        `Number of logs found for subscription sub1: ${filteredLogs.length}`
      )

      // Verify sending to socket
      expect(mockedSocketManager.getLogSocketClient).toHaveBeenCalledWith('socket1')
      expect(mockLogSocketClient.socket.send).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'log_found',
          subscription_id: 'sub1',
          logs: filteredLogs,
        })
      )

      consoleSpy.mockRestore()
    })

    it('should skip processing when no logs found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      const receipts = [{ id: 'receipt1' }]
      const mockedParser = CollectorDataParser as jest.Mocked<typeof CollectorDataParser>
      mockedParser.extractLogsFromReceipts.mockReturnValue([])

      const handler = socketEventHandlers.get('/data/receipt')!
      await handler(receipts)

      expect(consoleSpy).toHaveBeenCalledWith('Number of logs found in receipts: 0')
      expect(CollectorDataParser.IndexedLogs).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle multiple subscriptions', async () => {
      await setupCollectorListener()

      const receipts = [{ id: 'receipt1' }]
      const logs = [
        {
          address: '0x111',
          blockHash: '0xblock1',
          blockNumber: '0x1',
          data: '0xdata1',
          logIndex: '0x0',
          transactionHash: '0xtx1',
          transactionIndex: '0x0',
          topics: ['0xtopic1'],
        },
        {
          address: '0x222',
          blockHash: '0xblock2',
          blockNumber: '0x2',
          data: '0xdata2',
          logIndex: '0x1',
          transactionHash: '0xtx2',
          transactionIndex: '0x1',
          topics: ['0xtopic2'],
        },
      ]

      const mockedParser = CollectorDataParser as jest.Mocked<typeof CollectorDataParser>
      mockedParser.extractLogsFromReceipts.mockReturnValue(logs)

      // Setup multiple subscriptions
      SocketManager.logSubscriptionMap.set('sub1', {
        subscriptionId: 'sub1',
        socketId: 'socket1',
        filterOptions: { address: ['0x111'], topics: [] },
      })
      SocketManager.logSubscriptionMap.set('sub2', {
        subscriptionId: 'sub2',
        socketId: 'socket2',
        filterOptions: { address: ['0x222'], topics: [] },
      })

      // Mock different filter results
      mockIndexedLogs.filter
        .mockReturnValueOnce([logs[0]])
        .mockReturnValueOnce([logs[1]])

      // Mock socket clients
      const mockSocket1 = { socket: { send: jest.fn() } }
      const mockSocket2 = { socket: { send: jest.fn() } }
      const mockedSocketManager = SocketManager as jest.Mocked<typeof SocketManager>
      mockedSocketManager.getLogSocketClient
        .mockReturnValueOnce(mockSocket1 as any)
        .mockReturnValueOnce(mockSocket2 as any)

      const handler = socketEventHandlers.get('/data/receipt')!
      await handler(receipts)

      // Verify both subscriptions processed
      expect(mockIndexedLogs.filter).toHaveBeenCalledTimes(2)
      expect(mockSocket1.socket.send).toHaveBeenCalled()
      expect(mockSocket2.socket.send).toHaveBeenCalled()
    })

    it('should handle missing socket client gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      const receipts = [{ id: 'receipt1' }]
      const logs = [
        {
          address: '0x123',
          blockHash: '0xblock1',
          blockNumber: '0x1',
          data: '0xdata',
          logIndex: '0x0',
          transactionHash: '0xtx1',
          transactionIndex: '0x0',
          topics: ['0xtopic1'],
        },
      ]

      const mockedParser = CollectorDataParser as jest.Mocked<typeof CollectorDataParser>
      mockedParser.extractLogsFromReceipts.mockReturnValue(logs)

      SocketManager.logSubscriptionMap.set('sub1', {
        subscriptionId: 'sub1',
        socketId: 'socket1',
        filterOptions: { address: ['0x123'], topics: [] },
      })

      mockIndexedLogs.filter.mockReturnValue(logs)

      // Mock missing socket client
      const mockedSocketManager = SocketManager as jest.Mocked<typeof SocketManager>
      mockedSocketManager.getLogSocketClient.mockReturnValue(undefined)

      const handler = socketEventHandlers.get('/data/receipt')!
      await handler(receipts)

      // Should not throw and should log filter result
      expect(consoleSpy).toHaveBeenCalledWith(
        `Number of logs found for subscription sub1: ${logs.length}`
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Block Data Handler', () => {
    it('should send block data to all newHeads subscribers', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      // Setup subscribers
      const mockSend1 = jest.fn()
      const mockSend2 = jest.fn()
      const subscriber1 = { socket: { send: mockSend1 } }
      const subscriber2 = { socket: { send: mockSend2 } }
      
      newHeadsSubscribers.add(subscriber1 as any)
      newHeadsSubscribers.add(subscriber2 as any)

      // Mock StringUtils
      jest.mock('@shardeum-foundation/lib-types', () => ({
        Utils: {
          safeStringify: JSON.stringify,
        },
      }))

      const blockData = { number: 123, hash: '0xabc' }

      const handler = socketEventHandlers.get('/data/block')!
      await handler(blockData)

      expect(consoleSpy).toHaveBeenCalledWith('Received new block data')

      // Verify both subscribers received data - JSON key order may vary
      expect(mockSend1).toHaveBeenCalledWith(
        expect.stringContaining('"method":"newBlock_produced"')
      )
      expect(mockSend1).toHaveBeenCalledWith(
        expect.stringContaining('"number":123')
      )
      expect(mockSend1).toHaveBeenCalledWith(
        expect.stringContaining('"hash":"0xabc"')
      )
      expect(mockSend2).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('should handle send errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await setupCollectorListener()

      // Setup subscriber that throws
      const mockSend = jest.fn().mockImplementation(() => {
        throw new Error('Socket closed')
      })
      const subscriber = { socket: { send: mockSend } }
      newHeadsSubscribers.add(subscriber as any)

      const blockData = { number: 123 }

      const handler = socketEventHandlers.get('/data/block')!
      await handler(blockData)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending block data to subscriber: Error: Socket closed'
      )

      consoleSpy.mockRestore()
    })

    it('should handle empty subscriber list', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await setupCollectorListener()

      const blockData = { number: 123 }

      const handler = socketEventHandlers.get('/data/block')!
      
      // Should not throw
      await expect(handler(blockData)).resolves.not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('Received new block data')

      consoleSpy.mockRestore()
    })

    it('should handle complex block data structures', async () => {
      await setupCollectorListener()

      const mockSend = jest.fn()
      const subscriber = { socket: { send: mockSend } }
      newHeadsSubscribers.add(subscriber as any)

      const complexBlockData = {
        number: 123,
        hash: '0xabc',
        transactions: ['0xtx1', '0xtx2'],
        timestamp: Date.now(),
        nested: {
          data: {
            value: 'test',
          },
        },
      }

      const handler = socketEventHandlers.get('/data/block')!
      await handler(complexBlockData)

      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('"method":"newBlock_produced"')
      )
      // Check for key pieces of the complex data
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('"number":123')
      )
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('"transactions":["0xtx1","0xtx2"]')
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle socket connection failures', async () => {
      const mockedSocketClient = socketClient as jest.Mocked<typeof socketClient>
      mockedSocketClient.connect.mockImplementation(() => {
        throw new Error('Connection refused')
      })

      // Should not throw
      await expect(setupCollectorListener()).rejects.toThrow('Connection refused')
    })

    it('should handle malformed data in handlers', async () => {
      await setupCollectorListener()

      // Test each handler with malformed data
      const handlers = ['/data/cycle', '/data/receipt', '/data/block']
      const malformedData = [null, undefined, 'string', 123]

      for (const handlerName of handlers) {
        const handler = socketEventHandlers.get(handlerName)!
        
        for (const data of malformedData) {
          // Should not throw
          await expect(handler(data)).resolves.not.toThrow()
        }
      }
    })
  })
})