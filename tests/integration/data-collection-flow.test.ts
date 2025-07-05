import { DataSync } from '../../src/class/DataSync'
import { ValidateData } from '../../src/class/ValidateData'
import * as AccountStorage from '../../src/storage/account'
import * as TransactionStorage from '../../src/storage/transaction'
import * as ReceiptStorage from '../../src/storage/receipt'
import * as CycleStorage from '../../src/storage/cycle'
import * as db from '../../src/storage/sqlite3storage'
import * as config from '../../src/config'
import axios from 'axios'

jest.mock('axios')
jest.mock('../../src/storage/sqlite3storage')
jest.mock('../../src/storage/account')
jest.mock('../../src/storage/transaction')
jest.mock('../../src/storage/receipt')
jest.mock('../../src/storage/cycle')
jest.mock('../../src/utils/crypto', () => ({
  verify: jest.fn().mockReturnValue(true),
  setCryptoHashKey: jest.fn(),
  hashObj: jest.fn().mockReturnValue('mock-hash'),
}))

describe('Data Collection Flow Integration Tests', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>
  let dataSync: DataSync
  let validateData: ValidateData

  const mockDistributorNode = {
    ip: '127.0.0.1',
    port: 6101,
    publicKey: 'mock-public-key',
  }

  const mockCycleData = {
    cycleMarker: 'cycle-1',
    counter: 1,
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
  }

  const mockAccountData = {
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

  const mockTransactionData = {
    txId: 'tx-123',
    timestamp: Date.now(),
    cycle: 1,
    sign: {
      owner: mockDistributorNode.publicKey,
      sig: 'mock-signature',
    },
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
      timestampReceipt: {
        timestamp: Date.now(),
        signedGroup: ['node1', 'node2'],
      },
    },
    appReceiptData: {
      accountId: 'acc-123',
      data: {
        gasUsed: '21000',
        status: '0x1',
      },
    },
  }

  const mockReceiptData = {
    receiptId: 'receipt-123',
    tx: mockTransactionData,
    cycle: 1,
    timestamp: Date.now(),
    sign: {
      owner: mockDistributorNode.publicKey,
      sig: 'mock-signature',
    },
    executionShardKey: 'shard-key',
    globalModification: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    config.DISTRIBUTOR_CONFIG.nodes = [mockDistributorNode]
    config.enableCollectorSocketServer = true
    config.DISTRIBUTOR_CONFIG.active = true
    
    dataSync = new DataSync()
    validateData = new ValidateData()

    ;(db.init as jest.Mock).mockResolvedValue(undefined)
    ;(AccountStorage.insertAccount as jest.Mock).mockResolvedValue(undefined)
    ;(TransactionStorage.insertTransaction as jest.Mock).mockResolvedValue(undefined)
    ;(ReceiptStorage.insertReceipt as jest.Mock).mockResolvedValue(undefined)
    ;(CycleStorage.insertCycle as jest.Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('should complete full data collection flow for a cycle', async () => {
    jest.useFakeTimers()

    ;(CycleStorage.queryCycleByCounter as jest.Mock).mockResolvedValue(null)
    ;(CycleStorage.queryLatestCycleCounter as jest.Mock).mockResolvedValue(0)
    
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/cycles')) {
        return Promise.resolve({
          data: {
            cycles: [mockCycleData],
            success: true,
          },
        })
      }
      if (url.includes('/accounts')) {
        return Promise.resolve({
          data: {
            accounts: [mockAccountData],
            success: true,
          },
        })
      }
      if (url.includes('/transactions')) {
        return Promise.resolve({
          data: {
            transactions: [mockTransactionData],
            success: true,
          },
        })
      }
      if (url.includes('/receipts')) {
        return Promise.resolve({
          data: {
            receipts: [mockReceiptData],
            success: true,
          },
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const syncSpy = jest.spyOn(dataSync, 'queryFromDistributor')
    dataSync.config = config
    dataSync['distributorIndex'] = 0

    const cycleData = await dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/cycles?start=1&end=1`,
      'cycles',
      'CycleData'
    )
    expect(cycleData).toHaveLength(1)
    expect(cycleData[0]).toMatchObject({
      cycleMarker: 'cycle-1',
      counter: 1,
    })

    const accountData = await dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/accounts?cycleNumber=1`,
      'accounts',
      'AccountData'
    )
    expect(accountData).toHaveLength(1)
    expect(accountData[0]).toMatchObject({
      accountId: 'acc-123',
    })

    const txData = await dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/transactions?cycleNumber=1`,
      'transactions',
      'TransactionData'
    )
    expect(txData).toHaveLength(1)
    expect(txData[0]).toMatchObject({
      txId: 'tx-123',
    })

    const receiptData = await dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/receipts?cycleNumber=1`,
      'receipts',
      'ReceiptData'
    )
    expect(receiptData).toHaveLength(1)
    expect(receiptData[0]).toMatchObject({
      receiptId: 'receipt-123',
    })

    expect(syncSpy).toHaveBeenCalledTimes(4)
    expect(mockedAxios.get).toHaveBeenCalledTimes(4)

    jest.useRealTimers()
  })

  test('should handle data validation and storage', async () => {
    const isValidCycle = validateData.validateData(mockCycleData, 'CycleData')
    expect(isValidCycle).toBe(true)

    const isValidAccount = validateData.validateData(mockAccountData, 'AccountData')
    expect(isValidAccount).toBe(true)

    const isValidTransaction = validateData.validateData(mockTransactionData, 'TransactionData')
    expect(isValidTransaction).toBe(true)

    const isValidReceipt = validateData.validateData(mockReceiptData, 'ReceiptData')
    expect(isValidReceipt).toBe(true)

    await CycleStorage.insertCycle(mockCycleData)
    expect(CycleStorage.insertCycle).toHaveBeenCalledWith(mockCycleData)

    await AccountStorage.insertAccount(mockAccountData)
    expect(AccountStorage.insertAccount).toHaveBeenCalledWith(mockAccountData)

    await TransactionStorage.insertTransaction(mockTransactionData)
    expect(TransactionStorage.insertTransaction).toHaveBeenCalledWith(mockTransactionData)

    await ReceiptStorage.insertReceipt(mockReceiptData, mockReceiptData.executionShardKey)
    expect(ReceiptStorage.insertReceipt).toHaveBeenCalledWith(
      mockReceiptData,
      mockReceiptData.executionShardKey
    )
  })

  test('should handle distributor node failover', async () => {
    config.DISTRIBUTOR_CONFIG.nodes = [
      mockDistributorNode,
      { ...mockDistributorNode, ip: '127.0.0.2', port: 6102 },
    ]

    dataSync.config = config
    dataSync['distributorIndex'] = 0

    mockedAxios.get
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce({
        data: {
          cycles: [mockCycleData],
          success: true,
        },
      })

    const cycleData = await dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/cycles?start=1&end=1`,
      'cycles',
      'CycleData'
    )

    expect(cycleData).toHaveLength(1)
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/cycles?start=1&end=1`,
      expect.any(Object)
    )
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      `http://127.0.0.2:6102/cycles?start=1&end=1`,
      expect.any(Object)
    )
  })

  test('should handle data deduplication', async () => {
    const duplicateAccount = { ...mockAccountData }
    const accounts = [mockAccountData, duplicateAccount]

    const uniqueAccounts = new Map()
    for (const account of accounts) {
      uniqueAccounts.set(account.accountId, account)
    }

    expect(uniqueAccounts.size).toBe(1)
    expect(uniqueAccounts.get('acc-123')).toEqual(mockAccountData)
  })

  test('should handle rate limiting and retries', async () => {
    jest.useFakeTimers()

    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({
        data: {
          cycles: [mockCycleData],
          success: true,
        },
      })

    dataSync.config = config
    dataSync['distributorIndex'] = 0

    const promise = dataSync.queryFromDistributor(
      `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/cycles?start=1&end=1`,
      'cycles',
      'CycleData'
    )

    jest.advanceTimersByTime(1000)

    const cycleData = await promise

    expect(cycleData).toHaveLength(1)
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })

  test('should handle concurrent data collection', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/cycles')) {
        return Promise.resolve({
          data: { cycles: [mockCycleData], success: true },
        })
      }
      if (url.includes('/accounts')) {
        return Promise.resolve({
          data: { accounts: [mockAccountData], success: true },
        })
      }
      if (url.includes('/transactions')) {
        return Promise.resolve({
          data: { transactions: [mockTransactionData], success: true },
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    dataSync.config = config
    dataSync['distributorIndex'] = 0

    const [cycles, accounts, transactions] = await Promise.all([
      dataSync.queryFromDistributor(
        `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/cycles?start=1&end=1`,
        'cycles',
        'CycleData'
      ),
      dataSync.queryFromDistributor(
        `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/accounts?cycleNumber=1`,
        'accounts',
        'AccountData'
      ),
      dataSync.queryFromDistributor(
        `http://${mockDistributorNode.ip}:${mockDistributorNode.port}/transactions?cycleNumber=1`,
        'transactions',
        'TransactionData'
      ),
    ])

    expect(cycles).toHaveLength(1)
    expect(accounts).toHaveLength(1)
    expect(transactions).toHaveLength(1)
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
  })
})