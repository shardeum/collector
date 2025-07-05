import request from 'supertest'
import express from 'express'
import { setupRoutes } from '../../src/routes'
import * as AccountStorage from '../../src/storage/account'
import * as TransactionStorage from '../../src/storage/transaction'
import * as ReceiptStorage from '../../src/storage/receipt'
import * as CycleStorage from '../../src/storage/cycle'
import * as BlockStorage from '../../src/storage/block'
import * as OriginalTxDataStorage from '../../src/storage/originalTxData'
import * as db from '../../src/storage/sqlite3storage'
import * as config from '../../src/config'

jest.mock('../../src/storage/sqlite3storage')
jest.mock('../../src/storage/account')
jest.mock('../../src/storage/transaction')
jest.mock('../../src/storage/receipt')
jest.mock('../../src/storage/cycle')
jest.mock('../../src/storage/block')
jest.mock('../../src/storage/originalTxData')
jest.mock('../../src/utils/crypto', () => ({
  verify: jest.fn().mockReturnValue(true),
  setCryptoHashKey: jest.fn(),
  hashObj: jest.fn().mockReturnValue('mock-hash'),
}))

describe('API Flow Integration Tests', () => {
  let app: express.Application

  const mockAccount = {
    accountId: 'acc-123',
    data: {
      account: {
        balance: '1000000',
        nonce: '0',
      },
      ethAddress: '0x1234567890123456789012345678901234567890',
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
    hash: 'account-hash',
    cycleNumber: 1,
    isGlobal: false,
  }

  const mockTransaction = {
    txId: 'tx-123',
    timestamp: Date.now(),
    cycle: 1,
    originalTxData: {
      tx: {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '1000000000000000000',
        data: '0x',
        nonce: '0',
        gasPrice: '20000000000',
        gasLimit: '21000',
      },
    },
    wrappedEVMAccount: {
      contractAddress: null,
      contractStorageKey: null,
      ethAddress: '0x1234567890123456789012345678901234567890',
      nonce: '0',
      balance: '1000000000000000000',
    },
  }

  const mockReceipt = {
    receiptId: 'receipt-123',
    txId: 'tx-123',
    timestamp: Date.now(),
    cycle: 1,
    tx: {
      txId: 'tx-123',
      timestamp: Date.now(),
    },
    executionShardKey: 'shard-key',
    globalModification: false,
    appReceiptData: {
      data: {
        blockHash: '0xblockhash',
        blockNumber: '0x1',
        contractAddress: null,
        cumulativeGasUsed: '0x5208',
        from: '0x1234567890123456789012345678901234567890',
        gasUsed: '0x5208',
        logs: [],
        logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        status: '0x1',
        to: '0x0987654321098765432109876543210987654321',
        transactionHash: 'tx-123',
        transactionIndex: '0x0',
      },
    },
  }

  const mockCycle = {
    counter: 1,
    cycleMarker: 'cycle-1',
    mode: 'normal',
    previous: 'cycle-0',
    start: Date.now() - 60000,
    duration: 60,
    networkConfigHash: 'config-hash',
    active: ['node1', 'node2'],
    activated: [],
    removed: [],
    apoptosized: [],
    syncing: 0,
    timestamp: Date.now(),
  }

  const mockBlock = {
    number: 1,
    hash: '0xblockhash',
    timestamp: Date.now() / 1000,
    cycle: 1,
    transactions: ['tx-123'],
    readableBlock: {
      difficulty: '0x0',
      extraData: '0x',
      gasLimit: '0x1c9c380',
      gasUsed: '0x5208',
      hash: '0xblockhash',
      logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      miner: '0x0000000000000000000000000000000000000000',
      mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      nonce: '0x0000000000000000',
      number: '0x1',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      receiptsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sha3Uncles: '0x0000000000000000000000000000000000000000000000000000000000000000',
      size: '0x0',
      stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
      totalDifficulty: '0x0',
      transactions: ['tx-123'],
      transactionsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      uncles: [],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    app = express()
    app.use(express.json())
    setupRoutes(app)

    config.DISTRIBUTOR_CONFIG.active = true
    config.enableCollectorSocketServer = true

    ;(db.init as jest.Mock).mockResolvedValue(undefined)
    ;(db.db as any) = {
      all: jest.fn(),
      get: jest.fn(),
      run: jest.fn(),
    }
  })

  test('GET /accounts/:accountId - should return account by ID', async () => {
    ;(AccountStorage.queryAccountByAccountId as jest.Mock).mockResolvedValue(mockAccount)

    const response = await request(app)
      .get('/accounts/acc-123')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      account: mockAccount,
    })
    expect(AccountStorage.queryAccountByAccountId).toHaveBeenCalledWith('acc-123')
  })

  test('GET /accounts - should return paginated accounts', async () => {
    ;(AccountStorage.queryAccounts as jest.Mock).mockResolvedValue([mockAccount])
    ;(AccountStorage.queryAccountCount as jest.Mock).mockResolvedValue(1)

    const response = await request(app)
      .get('/accounts?page=1&per_page=10')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      accounts: [mockAccount],
      totalPages: 1,
      currentPage: 1,
    })
    expect(AccountStorage.queryAccounts).toHaveBeenCalledWith(1, 10, undefined)
  })

  test('GET /transaction/:txId - should return transaction by ID', async () => {
    ;(TransactionStorage.queryTransactionByTxId as jest.Mock).mockResolvedValue(mockTransaction)

    const response = await request(app)
      .get('/transaction/tx-123')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      transaction: mockTransaction,
    })
    expect(TransactionStorage.queryTransactionByTxId).toHaveBeenCalledWith('tx-123')
  })

  test('GET /full-nodelist - should return list of distributor nodes', async () => {
    config.DISTRIBUTOR_CONFIG.nodes = [
      { ip: '127.0.0.1', port: 6101, publicKey: 'key1' },
      { ip: '127.0.0.2', port: 6102, publicKey: 'key2' },
    ]

    const response = await request(app)
      .get('/full-nodelist')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      nodeList: config.DISTRIBUTOR_CONFIG.nodes,
    })
  })

  test('GET /receipt/:txId - should return receipt by transaction ID', async () => {
    ;(ReceiptStorage.queryReceiptByTxId as jest.Mock).mockResolvedValue(mockReceipt)

    const response = await request(app)
      .get('/receipt/tx-123')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      receipt: mockReceipt,
    })
    expect(ReceiptStorage.queryReceiptByTxId).toHaveBeenCalledWith('tx-123')
  })

  test('GET /block/:numberOrHash - should return block by number', async () => {
    ;(BlockStorage.queryBlockByNumber as jest.Mock).mockResolvedValue(mockBlock)

    const response = await request(app)
      .get('/block/1')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      block: mockBlock,
    })
    expect(BlockStorage.queryBlockByNumber).toHaveBeenCalledWith(1)
  })

  test('GET /block/:numberOrHash - should return block by hash', async () => {
    ;(BlockStorage.queryBlockByHash as jest.Mock).mockResolvedValue(mockBlock)

    const response = await request(app)
      .get('/block/0xblockhash')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      block: mockBlock,
    })
    expect(BlockStorage.queryBlockByHash).toHaveBeenCalledWith('0xblockhash')
  })

  test('GET /blocks - should return paginated blocks', async () => {
    ;(BlockStorage.queryBlocks as jest.Mock).mockResolvedValue([mockBlock])
    ;(BlockStorage.queryBlockCount as jest.Mock).mockResolvedValue(1)

    const response = await request(app)
      .get('/blocks?page=1&per_page=10')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      blocks: [mockBlock],
      totalPages: 1,
      currentPage: 1,
    })
    expect(BlockStorage.queryBlocks).toHaveBeenCalledWith(1, 10, undefined)
  })

  test('GET /totalData - should return data totals', async () => {
    ;(CycleStorage.queryCycleCount as jest.Mock).mockResolvedValue(100)
    ;(AccountStorage.queryAccountCount as jest.Mock).mockResolvedValue(1000)
    ;(TransactionStorage.queryTransactionCount as jest.Mock).mockResolvedValue(5000)
    ;(ReceiptStorage.queryReceiptCount as jest.Mock).mockResolvedValue(5000)

    const response = await request(app)
      .get('/totalData')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      totalCycles: 100,
      totalAccounts: 1000,
      totalTransactions: 5000,
      totalReceipts: 5000,
    })
  })

  test('should handle errors gracefully', async () => {
    ;(AccountStorage.queryAccountByAccountId as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const response = await request(app)
      .get('/accounts/acc-123')
      .expect(500)

    expect(response.body).toMatchObject({
      success: false,
      error: 'Database error',
    })
  })

  test('should validate query parameters', async () => {
    const response = await request(app)
      .get('/accounts?page=abc&per_page=xyz')
      .expect(400)

    expect(response.body).toMatchObject({
      success: false,
      error: expect.stringContaining('Invalid'),
    })
  })

  test('should handle missing resources', async () => {
    ;(TransactionStorage.queryTransactionByTxId as jest.Mock).mockResolvedValue(null)

    const response = await request(app)
      .get('/transaction/non-existent')
      .expect(404)

    expect(response.body).toMatchObject({
      success: false,
      error: 'Transaction not found',
    })
  })

  test('GET /originalTx/:txId - should return original transaction data', async () => {
    const mockOriginalTx = {
      txId: 'tx-123',
      timestamp: Date.now(),
      originalTxData: {
        tx: mockTransaction.originalTxData.tx,
      },
      sign: {
        owner: 'public-key',
        sig: 'signature',
      },
    }

    ;(OriginalTxDataStorage.queryOriginalTxDataByTxId as jest.Mock).mockResolvedValue(mockOriginalTx)

    const response = await request(app)
      .get('/originalTx/tx-123')
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      originalTx: mockOriginalTx,
    })
    expect(OriginalTxDataStorage.queryOriginalTxDataByTxId).toHaveBeenCalledWith('tx-123')
  })

  test('should handle concurrent requests', async () => {
    ;(AccountStorage.queryAccountByAccountId as jest.Mock).mockImplementation((id) => {
      return Promise.resolve({ ...mockAccount, accountId: id })
    })

    const requests = Array.from({ length: 10 }, (_, i) =>
      request(app).get(`/accounts/acc-${i}`)
    )

    const responses = await Promise.all(requests)

    responses.forEach((response, i) => {
      expect(response.status).toBe(200)
      expect(response.body.account.accountId).toBe(`acc-${i}`)
    })

    expect(AccountStorage.queryAccountByAccountId).toHaveBeenCalledTimes(10)
  })

  test('should respect rate limits', async () => {
    const requests = Array.from({ length: 20 }, () =>
      request(app).get('/totalData')
    )

    const responses = await Promise.all(requests)
    const successCount = responses.filter(r => r.status === 200).length
    const rateLimitedCount = responses.filter(r => r.status === 429).length

    expect(successCount).toBeGreaterThan(0)
    expect(successCount + rateLimitedCount).toBe(20)
  })
})