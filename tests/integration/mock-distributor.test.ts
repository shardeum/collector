import * as http from 'http'
import express from 'express'
import { Server as SocketIOServer } from 'socket.io'
import { DataSync } from '../../src/class/DataSync'
import { ValidateData } from '../../src/class/ValidateData'
import * as config from '../../src/config'
import * as db from '../../src/storage/sqlite3storage'
import * as CycleStorage from '../../src/storage/cycle'
import * as AccountStorage from '../../src/storage/account'
import * as TransactionStorage from '../../src/storage/transaction'
import * as ReceiptStorage from '../../src/storage/receipt'

jest.mock('../../src/storage/sqlite3storage')
jest.mock('../../src/storage/cycle')
jest.mock('../../src/storage/account')
jest.mock('../../src/storage/transaction')
jest.mock('../../src/storage/receipt')
jest.mock('../../src/utils/crypto', () => ({
  verify: jest.fn().mockReturnValue(true),
  setCryptoHashKey: jest.fn(),
  hashObj: jest.fn().mockReturnValue('mock-hash'),
}))

describe('Mock Distributor Integration Tests', () => {
  let mockDistributor1: http.Server
  let mockDistributor2: http.Server
  let mockDistributor3: http.Server
  let dataSync: DataSync
  let validateData: ValidateData
  const port1 = 6001
  const port2 = 6002
  const port3 = 6003

  const createMockData = (nodeId: string, cycleNumber: number) => ({
    cycle: {
      cycleMarker: `cycle-${cycleNumber}`,
      counter: cycleNumber,
      mode: 'normal',
      previous: cycleNumber > 1 ? `cycle-${cycleNumber - 1}` : '',
      start: Date.now() - (60000 * (10 - cycleNumber)),
      duration: 60,
      networkConfigHash: 'config-hash',
      active: ['node1', 'node2', 'node3'],
      activated: [],
      removed: [],
      apoptosized: [],
      syncing: 0,
      activated_count: 0,
      removed_count: 0,
      apoptosized_count: 0,
      joined: [],
      returned: [],
      nodeListHash: 'node-list-hash',
      refreshedArchivers: [],
      refreshedConsensors: [],
      lostArchivers: [],
      lostConsensors: [],
      lostSyncing: 0,
      refuted: [],
      timestamp: Date.now(),
    },
    accounts: [
      {
        accountId: `acc-${nodeId}-${cycleNumber}-1`,
        data: {
          account: {
            balance: '1000000',
            nonce: '0',
          },
          ethAddress: `0x${nodeId}1234567890123456789012345678901234567890`.slice(0, 42),
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        hash: `account-hash-${nodeId}-${cycleNumber}`,
        cycleNumber,
        isGlobal: false,
      },
    ],
    transactions: [
      {
        txId: `tx-${nodeId}-${cycleNumber}-1`,
        timestamp: Date.now(),
        cycle: cycleNumber,
        sign: {
          owner: `public-key-${nodeId}`,
          sig: `signature-${nodeId}`,
        },
        originalTxData: {
          tx: {
            from: `0x${nodeId}1234567890123456789012345678901234567890`.slice(0, 42),
            to: '0x0987654321098765432109876543210987654321',
            value: '1000000000000000000',
            data: '0x',
            nonce: '0',
            gasPrice: '20000000000',
            gasLimit: '21000',
          },
          timestampReceipt: {
            timestamp: Date.now(),
            signedGroup: ['node1', 'node2'],
          },
        },
        appReceiptData: {
          accountId: `acc-${nodeId}-${cycleNumber}-1`,
          data: {
            gasUsed: '21000',
            status: '0x1',
          },
        },
      },
    ],
    receipts: [
      {
        receiptId: `receipt-${nodeId}-${cycleNumber}-1`,
        tx: {
          txId: `tx-${nodeId}-${cycleNumber}-1`,
          timestamp: Date.now(),
        },
        cycle: cycleNumber,
        timestamp: Date.now(),
        sign: {
          owner: `public-key-${nodeId}`,
          sig: `signature-${nodeId}`,
        },
        executionShardKey: `shard-key-${nodeId}`,
        globalModification: false,
        appReceiptData: {
          data: {
            gasUsed: '21000',
            status: '0x1',
          },
        },
      },
    ],
  })

  const createMockDistributor = (port: number, nodeId: string) => {
    const app = express()
    app.use(express.json())

    const serverData = createMockData(nodeId, 1)

    app.get('/cycles', (req, res) => {
      const { start, end } = req.query
      const startNum = parseInt(start as string) || 1
      const endNum = parseInt(end as string) || 1
      
      const cycles = []
      for (let i = startNum; i <= endNum; i++) {
        cycles.push(createMockData(nodeId, i).cycle)
      }
      
      res.json({ cycles, success: true })
    })

    app.get('/accounts', (req, res) => {
      const { cycleNumber } = req.query
      const cycle = parseInt(cycleNumber as string) || 1
      const data = createMockData(nodeId, cycle)
      res.json({ accounts: data.accounts, success: true })
    })

    app.get('/transactions', (req, res) => {
      const { cycleNumber } = req.query
      const cycle = parseInt(cycleNumber as string) || 1
      const data = createMockData(nodeId, cycle)
      res.json({ transactions: data.transactions, success: true })
    })

    app.get('/receipts', (req, res) => {
      const { cycleNumber } = req.query
      const cycle = parseInt(cycleNumber as string) || 1
      const data = createMockData(nodeId, cycle)
      res.json({ receipts: data.receipts, success: true })
    })

    app.get('/totalData', (req, res) => {
      res.json({
        totalCycles: 10,
        totalAccounts: 100,
        totalTransactions: 500,
        totalReceipts: 500,
        success: true,
      })
    })

    const server = http.createServer(app)
    const io = new SocketIOServer(server, {
      cors: { origin: '*' },
    })

    io.on('connection', (socket) => {
      socket.on('subscribe-collector-data', () => {
        setInterval(() => {
          const cycleNumber = Math.floor(Date.now() / 60000) % 10 + 1
          const data = createMockData(nodeId, cycleNumber)
          socket.emit('collector-data', {
            responses: [
              {
                receipts: data.receipts,
                accounts: data.accounts,
                transactions: data.transactions,
              },
            ],
          })
        }, 5000)
      })
    })

    return server
  }

  beforeEach((done) => {
    jest.clearAllMocks()

    config.DISTRIBUTOR_CONFIG.nodes = [
      { ip: '127.0.0.1', port: port1, publicKey: 'key1' },
      { ip: '127.0.0.1', port: port2, publicKey: 'key2' },
      { ip: '127.0.0.1', port: port3, publicKey: 'key3' },
    ]
    config.DISTRIBUTOR_CONFIG.active = true

    dataSync = new DataSync()
    dataSync.config = config
    validateData = new ValidateData()

    ;(db.init as jest.Mock).mockResolvedValue(undefined)
    ;(CycleStorage.insertCycle as jest.Mock).mockResolvedValue(undefined)
    ;(AccountStorage.insertAccount as jest.Mock).mockResolvedValue(undefined)
    ;(TransactionStorage.insertTransaction as jest.Mock).mockResolvedValue(undefined)
    ;(ReceiptStorage.insertReceipt as jest.Mock).mockResolvedValue(undefined)

    mockDistributor1 = createMockDistributor(port1, 'node1')
    mockDistributor2 = createMockDistributor(port2, 'node2')
    mockDistributor3 = createMockDistributor(port3, 'node3')

    let serversReady = 0
    const checkReady = () => {
      serversReady++
      if (serversReady === 3) done()
    }

    mockDistributor1.listen(port1, checkReady)
    mockDistributor2.listen(port2, checkReady)
    mockDistributor3.listen(port3, checkReady)
  })

  afterEach((done) => {
    let serversClosed = 0
    const checkClosed = () => {
      serversClosed++
      if (serversClosed === 3) done()
    }

    mockDistributor1.close(checkClosed)
    mockDistributor2.close(checkClosed)
    mockDistributor3.close(checkClosed)
  })

  test('should sync data from multiple distributor nodes', async () => {
    const cyclePromises = config.DISTRIBUTOR_CONFIG.nodes.map((node, index) => {
      dataSync['distributorIndex'] = index
      return dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/cycles?start=1&end=3`,
        'cycles',
        'CycleData'
      )
    })

    const allCycles = await Promise.all(cyclePromises)

    expect(allCycles).toHaveLength(3)
    allCycles.forEach((cycles, index) => {
      expect(cycles).toHaveLength(3)
      expect(cycles[0].cycleMarker).toBe('cycle-1')
      expect(cycles[1].cycleMarker).toBe('cycle-2')
      expect(cycles[2].cycleMarker).toBe('cycle-3')
    })
  })

  test('should handle distributor node failure and failover', async () => {
    mockDistributor1.close()

    dataSync['distributorIndex'] = 0
    const cycles = await dataSync.queryFromDistributor(
      `http://127.0.0.1:${port1}/cycles?start=1&end=1`,
      'cycles',
      'CycleData'
    )

    expect(cycles).toHaveLength(1)
    expect(cycles[0].cycleMarker).toBe('cycle-1')
  })

  test('should validate data consistency across nodes', async () => {
    const accountPromises = config.DISTRIBUTOR_CONFIG.nodes.map((node, index) => {
      dataSync['distributorIndex'] = index
      return dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/accounts?cycleNumber=1`,
        'accounts',
        'AccountData'
      )
    })

    const allAccounts = await Promise.all(accountPromises)

    const uniqueAccountIds = new Set()
    allAccounts.forEach((accounts) => {
      accounts.forEach((account: any) => {
        uniqueAccountIds.add(account.accountId)
      })
    })

    expect(uniqueAccountIds.size).toBe(3)
    expect(Array.from(uniqueAccountIds)).toEqual(
      expect.arrayContaining(['acc-node1-1-1', 'acc-node2-1-1', 'acc-node3-1-1'])
    )
  })

  test('should handle data aggregation from multiple nodes', async () => {
    const transactionPromises = config.DISTRIBUTOR_CONFIG.nodes.map((node, index) => {
      dataSync['distributorIndex'] = index
      return dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/transactions?cycleNumber=1`,
        'transactions',
        'TransactionData'
      )
    })

    const allTransactions = await Promise.all(transactionPromises)
    const aggregatedTransactions = allTransactions.flat()

    expect(aggregatedTransactions).toHaveLength(3)
    expect(aggregatedTransactions.map((tx: any) => tx.txId)).toEqual(
      expect.arrayContaining(['tx-node1-1-1', 'tx-node2-1-1', 'tx-node3-1-1'])
    )
  })

  test('should handle round-robin distributor selection', async () => {
    const requests = []
    for (let i = 0; i < 9; i++) {
      dataSync['distributorIndex'] = i % 3
      requests.push(
        dataSync.queryFromDistributor(
          `http://${config.DISTRIBUTOR_CONFIG.nodes[i % 3].ip}:${config.DISTRIBUTOR_CONFIG.nodes[i % 3].port}/totalData`,
          'totalData',
          'TotalData'
        )
      )
    }

    const results = await Promise.all(requests)

    expect(results).toHaveLength(9)
    results.forEach((result) => {
      expect(result).toMatchObject({
        totalCycles: 10,
        totalAccounts: 100,
        totalTransactions: 500,
        totalReceipts: 500,
        success: true,
      })
    })
  })

  test('should validate all data types from distributors', async () => {
    dataSync['distributorIndex'] = 0
    const node = config.DISTRIBUTOR_CONFIG.nodes[0]

    const [cycles, accounts, transactions, receipts] = await Promise.all([
      dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/cycles?start=1&end=1`,
        'cycles',
        'CycleData'
      ),
      dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/accounts?cycleNumber=1`,
        'accounts',
        'AccountData'
      ),
      dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/transactions?cycleNumber=1`,
        'transactions',
        'TransactionData'
      ),
      dataSync.queryFromDistributor(
        `http://${node.ip}:${node.port}/receipts?cycleNumber=1`,
        'receipts',
        'ReceiptData'
      ),
    ])

    expect(validateData.validateData(cycles[0], 'CycleData')).toBe(true)
    expect(validateData.validateData(accounts[0], 'AccountData')).toBe(true)
    expect(validateData.validateData(transactions[0], 'TransactionData')).toBe(true)
    expect(validateData.validateData(receipts[0], 'ReceiptData')).toBe(true)
  })

  test('should handle partial node failures gracefully', async () => {
    mockDistributor1.close()
    mockDistributor2.close()

    const activeNodes = config.DISTRIBUTOR_CONFIG.nodes.filter((_, index) => index === 2)
    
    const promises = []
    for (let i = 0; i < 3; i++) {
      dataSync['distributorIndex'] = i
      promises.push(
        dataSync.queryFromDistributor(
          `http://${config.DISTRIBUTOR_CONFIG.nodes[i].ip}:${config.DISTRIBUTOR_CONFIG.nodes[i].port}/cycles?start=1&end=1`,
          'cycles',
          'CycleData'
        )
      )
    }

    const results = await Promise.all(promises)

    const successfulResults = results.filter(result => result && result.length > 0)
    expect(successfulResults.length).toBeGreaterThan(0)
    successfulResults.forEach(cycles => {
      expect(cycles[0].cycleMarker).toBe('cycle-1')
    })
  })

  test('should handle concurrent requests to different nodes', async () => {
    const concurrentRequests = 20
    const requests = []

    for (let i = 0; i < concurrentRequests; i++) {
      const nodeIndex = i % 3
      const node = config.DISTRIBUTOR_CONFIG.nodes[nodeIndex]
      dataSync['distributorIndex'] = nodeIndex
      
      requests.push(
        dataSync.queryFromDistributor(
          `http://${node.ip}:${node.port}/accounts?cycleNumber=${(i % 3) + 1}`,
          'accounts',
          'AccountData'
        )
      )
    }

    const results = await Promise.all(requests)

    expect(results).toHaveLength(concurrentRequests)
    results.forEach((accounts, index) => {
      expect(accounts).toHaveLength(1)
      expect(accounts[0].cycleNumber).toBe((index % 3) + 1)
    })
  })
})