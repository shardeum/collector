import { Server } from 'socket.io'
import { io as Client, Socket } from 'socket.io-client'
import * as http from 'http'
import { SocketManager } from '../../src/log_subscription/SocketManager'
import { Handler } from '../../src/log_subscription/Handler'
import { CollectorListener } from '../../src/log_subscription/CollectorListener'
import { CollectorDataParser } from '../../src/log_subscription/CollectorDataParser'
import * as config from '../../src/config'

jest.mock('../../src/storage/sqlite3storage')
jest.mock('../../src/utils/crypto', () => ({
  verify: jest.fn().mockReturnValue(true),
  setCryptoHashKey: jest.fn(),
  hashObj: jest.fn().mockReturnValue('mock-hash'),
}))

describe('WebSocket Subscription Flow Integration Tests', () => {
  let httpServer: http.Server
  let ioServer: Server
  let clientSocket: Socket
  let socketManager: SocketManager
  let handler: Handler
  let collectorListener: CollectorListener
  let dataParser: CollectorDataParser
  const serverPort = 9876

  const mockBlock = {
    difficulty: '0x0',
    extraData: '0x',
    gasLimit: '0x1c9c380',
    gasUsed: '0x5208',
    hash: '0xblockhash123',
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    miner: '0x0000000000000000000000000000000000000000',
    mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    nonce: '0x0000000000000000',
    number: '0x64',
    parentHash: '0xparenthash',
    receiptsRoot: '0xreceiptsroot',
    sha3Uncles: '0xuncles',
    size: '0x220',
    stateRoot: '0xstateroot',
    timestamp: '0x60d21b60',
    totalDifficulty: '0x0',
    transactions: ['0xtx1', '0xtx2'],
    transactionsRoot: '0xtxroot',
    uncles: [],
  }

  const mockCollectorData = {
    responses: [
      {
        receipts: [
          {
            receiptId: 'receipt-1',
            txId: 'tx-1',
            timestamp: Date.now(),
            appReceiptData: {
              data: {
                blockNumber: '0x64',
                blockHash: '0xblockhash123',
                logs: [
                  {
                    address: '0x1234567890123456789012345678901234567890',
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      '0x0000000000000000000000001111111111111111111111111111111111111111',
                      '0x0000000000000000000000002222222222222222222222222222222222222222',
                    ],
                    data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
                    blockNumber: '0x64',
                    transactionHash: 'tx-1',
                    transactionIndex: '0x0',
                    blockHash: '0xblockhash123',
                    logIndex: '0x0',
                    removed: false,
                  },
                ],
                from: '0x1111111111111111111111111111111111111111',
                to: '0x2222222222222222222222222222222222222222',
                transactionHash: 'tx-1',
                transactionIndex: '0x0',
                gasUsed: '0x5208',
                cumulativeGasUsed: '0x5208',
                status: '0x1',
              },
            },
          },
        ],
      },
    ],
  }

  beforeEach((done) => {
    jest.clearAllMocks()

    httpServer = http.createServer()
    ioServer = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    httpServer.listen(serverPort, () => {
      dataParser = new CollectorDataParser()
      handler = new Handler(dataParser)
      socketManager = new SocketManager(ioServer, handler)

      clientSocket = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      })

      clientSocket.on('connect', done)
    })

    config.enableCollectorSocketServer = true
    config.COLLECTOR_LOGS_SERVER_CONFIG = {
      ip: 'localhost',
      port: 9001,
    }
  })

  afterEach((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
    ioServer.close()
    httpServer.close(done)
  })

  test('should complete full WebSocket subscription flow for newHeads', (done) => {
    const subscriptionId = '0x1'
    let receivedData: any[] = []

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['newHeads'],
      id: 1,
    })

    clientSocket.on('eth_subscription', (data) => {
      receivedData.push(data)
      
      if (receivedData.length === 1) {
        expect(data).toMatchObject({
          jsonrpc: '2.0',
          method: 'eth_subscription',
          params: {
            subscription: expect.any(String),
            result: mockBlock,
          },
        })
        done()
      }
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      expect(response).toMatchObject({
        jsonrpc: '2.0',
        result: expect.any(String),
        id: 1,
      })

      setTimeout(() => {
        ioServer.emit('newHeads', mockBlock)
      }, 100)
    })
  })

  test('should complete full WebSocket subscription flow for logs with filters', (done) => {
    const filterParams = {
      address: '0x1234567890123456789012345678901234567890',
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
    }
    let receivedLogs: any[] = []

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['logs', filterParams],
      id: 2,
    })

    clientSocket.on('eth_subscription', (data) => {
      receivedLogs.push(data)
      
      if (receivedLogs.length === 1) {
        expect(data).toMatchObject({
          jsonrpc: '2.0',
          method: 'eth_subscription',
          params: {
            subscription: expect.any(String),
            result: expect.objectContaining({
              address: '0x1234567890123456789012345678901234567890',
              topics: expect.arrayContaining([
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              ]),
            }),
          },
        })
        done()
      }
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      expect(response).toMatchObject({
        jsonrpc: '2.0',
        result: expect.any(String),
        id: 2,
      })

      setTimeout(() => {
        ioServer.emit('collectorData', mockCollectorData)
      }, 100)
    })
  })

  test('should handle multiple concurrent subscriptions', (done) => {
    const subscriptions: { [key: string]: any[] } = {}
    let subscriptionCount = 0

    const checkComplete = () => {
      if (Object.keys(subscriptions).length === 3 &&
          Object.values(subscriptions).every(logs => logs.length > 0)) {
        done()
      }
    }

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['newHeads'],
      id: 1,
    })

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['logs', { address: '0x1234567890123456789012345678901234567890' }],
      id: 2,
    })

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['logs', { topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'] }],
      id: 3,
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      subscriptionCount++
      subscriptions[response.result] = []

      if (subscriptionCount === 3) {
        setTimeout(() => {
          ioServer.emit('newHeads', mockBlock)
          ioServer.emit('collectorData', mockCollectorData)
        }, 100)
      }
    })

    clientSocket.on('eth_subscription', (data) => {
      if (subscriptions[data.params.subscription]) {
        subscriptions[data.params.subscription].push(data)
        checkComplete()
      }
    })
  })

  test('should handle unsubscribe flow', (done) => {
    let subscriptionId: string
    let receivedCount = 0

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['newHeads'],
      id: 1,
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      subscriptionId = response.result

      ioServer.emit('newHeads', mockBlock)

      setTimeout(() => {
        clientSocket.emit('eth_unsubscribe', {
          jsonrpc: '2.0',
          method: 'eth_unsubscribe',
          params: [subscriptionId],
          id: 2,
        })
      }, 200)
    })

    clientSocket.on('eth_subscription', () => {
      receivedCount++
    })

    clientSocket.on('eth_unsubscribe_response', (response) => {
      expect(response).toMatchObject({
        jsonrpc: '2.0',
        result: true,
        id: 2,
      })

      setTimeout(() => {
        ioServer.emit('newHeads', mockBlock)
      }, 100)

      setTimeout(() => {
        expect(receivedCount).toBe(1)
        done()
      }, 300)
    })
  })

  test('should handle reconnection and resubscription', (done) => {
    let subscriptionId: string
    let reconnected = false

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['newHeads'],
      id: 1,
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      subscriptionId = response.result

      if (!reconnected) {
        setTimeout(() => {
          clientSocket.disconnect()
          setTimeout(() => {
            clientSocket.connect()
          }, 100)
        }, 100)
      }
    })

    clientSocket.on('connect', () => {
      if (subscriptionId) {
        reconnected = true
        
        clientSocket.emit('eth_subscribe', {
          jsonrpc: '2.0',
          method: 'eth_subscribe',
          params: ['newHeads'],
          id: 2,
        })
      }
    })

    clientSocket.on('eth_subscription', (data) => {
      if (reconnected) {
        expect(data.params.result).toEqual(mockBlock)
        done()
      }
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      if (response.id === 2) {
        setTimeout(() => {
          ioServer.emit('newHeads', mockBlock)
        }, 100)
      }
    })
  })

  test('should handle error scenarios gracefully', (done) => {
    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['invalidSubscriptionType'],
      id: 1,
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      expect(response).toMatchObject({
        jsonrpc: '2.0',
        error: expect.objectContaining({
          code: -32602,
          message: expect.stringContaining('Invalid subscription type'),
        }),
        id: 1,
      })
      done()
    })
  })

  test('should integrate with CollectorListener for data reception', (done) => {
    const mockCollectorServerPort = 9001
    const mockCollectorServer = http.createServer()
    const mockCollectorIo = new Server(mockCollectorServer, {
      cors: { origin: '*' },
    })

    mockCollectorServer.listen(mockCollectorServerPort, () => {
      collectorListener = new CollectorListener(
        `http://localhost:${mockCollectorServerPort}`,
        ioServer
      )

      mockCollectorIo.on('connection', (socket) => {
        socket.on('subscribe', (data) => {
          expect(data).toEqual({ type: 'collector-data' })
          
          setTimeout(() => {
            socket.emit('collector-data', mockCollectorData)
          }, 100)
        })
      })

      collectorListener.start()

      clientSocket.emit('eth_subscribe', {
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params: ['logs', { address: '0x1234567890123456789012345678901234567890' }],
        id: 1,
      })

      clientSocket.on('eth_subscription', (data) => {
        expect(data.params.result).toMatchObject({
          address: '0x1234567890123456789012345678901234567890',
        })
        
        collectorListener.stop()
        mockCollectorIo.close()
        mockCollectorServer.close(done)
      })
    })
  })

  test('should handle complex filter combinations', (done) => {
    const complexFilter = {
      address: [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
      ],
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        null,
        [
          '0x0000000000000000000000001111111111111111111111111111111111111111',
          '0x0000000000000000000000002222222222222222222222222222222222222222',
        ],
      ],
    }

    clientSocket.emit('eth_subscribe', {
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params: ['logs', complexFilter],
      id: 1,
    })

    clientSocket.on('eth_subscribe_response', (response) => {
      expect(response.result).toBeTruthy()
      
      setTimeout(() => {
        ioServer.emit('collectorData', mockCollectorData)
      }, 100)
    })

    clientSocket.on('eth_subscription', (data) => {
      expect(data.params.result).toMatchObject({
        address: '0x1234567890123456789012345678901234567890',
        topics: expect.arrayContaining([
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        ]),
      })
      done()
    })
  })
})