import * as fs from 'fs'
import * as path from 'path'
import * as db from '../../src/storage/sqlite3storage'
import * as CycleStorage from '../../src/storage/cycle'
import * as AccountStorage from '../../src/storage/account'
import * as TransactionStorage from '../../src/storage/transaction'
import * as ReceiptStorage from '../../src/storage/receipt'
import * as BlockStorage from '../../src/storage/block'
import * as OriginalTxDataStorage from '../../src/storage/originalTxData'
import * as config from '../../src/config'
import { Database } from 'sqlite3'

jest.unmock('../../src/storage/sqlite3storage')
jest.unmock('../../src/storage/cycle')
jest.unmock('../../src/storage/account')
jest.unmock('../../src/storage/transaction')
jest.unmock('../../src/storage/receipt')
jest.unmock('../../src/storage/block')
jest.unmock('../../src/storage/originalTxData')

describe('Database Persistence Integration Tests', () => {
  const testDbPath = path.join(__dirname, 'test-persistence.db')
  const testDbPath2 = path.join(__dirname, 'test-persistence-2.db')
  let originalDbPath: string

  const mockCycle = {
    counter: 1,
    cycleRecord: {
      activated: [],
      activatedPublicKeys: [],
      active: ['node1', 'node2'],
      activePublicKeys: ['key1', 'key2'],
      apoptosized: [],
      archiverListHash: 'archiver-hash',
      counter: 1,
      crashedNodeListHash: 'crashed-hash',
      cycleMarker: 'cycle-1',
      duration: 60,
      expired: 0,
      joined: [],
      joinedArchivers: [],
      joinedConsensors: [],
      leavingArchivers: [],
      lostArchivers: [],
      lostSyncing: 0,
      maxSyncTime: 10000,
      mode: 'normal',
      networkConfigHash: 'config-hash',
      networkId: 'test-network',
      nodeListHash: 'node-list-hash',
      previous: '',
      refreshedArchivers: [],
      refreshedConsensors: [],
      refuted: [],
      removed: [],
      removedArchivers: [],
      returned: [],
      safetyMode: false,
      safetyNum: 0,
      start: Date.now() - 60000,
      syncing: 0,
      networkStateHash: 'state-hash',
      random: 0.5,
      bigRandom: '12345',
    },
    cycleMarker: 'cycle-1',
    mode: 'normal',
    previous: '',
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
    sign: {
      owner: 'public-key',
      sig: 'signature',
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
    sign: {
      owner: 'public-key',
      sig: 'signature',
    },
  }

  const mockBlock = {
    number: 1,
    hash: '0xblockhash',
    timestamp: Math.floor(Date.now() / 1000),
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

  const mockOriginalTxData = {
    txId: 'tx-123',
    timestamp: Date.now(),
    originalTxData: mockTransaction.originalTxData,
    sign: {
      owner: 'public-key',
      sig: 'signature',
    },
  }

  beforeEach(async () => {
    originalDbPath = config.sqlite3DbPath
    
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    if (fs.existsSync(testDbPath2)) {
      fs.unlinkSync(testDbPath2)
    }
    
    config.sqlite3DbPath = testDbPath
    await db.init()
  })

  afterEach(async () => {
    if (db.db) {
      await new Promise<void>((resolve, reject) => {
        db.db.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
    
    config.sqlite3DbPath = originalDbPath
    
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    if (fs.existsSync(testDbPath2)) {
      fs.unlinkSync(testDbPath2)
    }
  })

  test('should persist data and recover after restart', async () => {
    await CycleStorage.insertCycle(mockCycle)
    await AccountStorage.insertAccount(mockAccount)
    await TransactionStorage.insertTransaction(mockTransaction)
    await ReceiptStorage.insertReceipt(mockReceipt, mockReceipt.executionShardKey)
    await BlockStorage.insertBlock(mockBlock)
    await OriginalTxDataStorage.insertOriginalTxData(mockOriginalTxData)

    const cycleBeforeRestart = await CycleStorage.queryCycleByCounter(1)
    expect(cycleBeforeRestart).toMatchObject({
      counter: 1,
      cycleMarker: 'cycle-1',
    })

    await new Promise<void>((resolve, reject) => {
      db.db.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await db.init()

    const cycleAfterRestart = await CycleStorage.queryCycleByCounter(1)
    const accountAfterRestart = await AccountStorage.queryAccountByAccountId('acc-123')
    const txAfterRestart = await TransactionStorage.queryTransactionByTxId('tx-123')
    const receiptAfterRestart = await ReceiptStorage.queryReceiptByTxId('tx-123')
    const blockAfterRestart = await BlockStorage.queryBlockByNumber(1)
    const originalTxAfterRestart = await OriginalTxDataStorage.queryOriginalTxDataByTxId('tx-123')

    expect(cycleAfterRestart).toMatchObject({
      counter: 1,
      cycleMarker: 'cycle-1',
    })
    expect(accountAfterRestart).toMatchObject({
      accountId: 'acc-123',
    })
    expect(txAfterRestart).toMatchObject({
      txId: 'tx-123',
    })
    expect(receiptAfterRestart).toMatchObject({
      receiptId: 'receipt-123',
    })
    expect(blockAfterRestart).toMatchObject({
      number: 1,
      hash: '0xblockhash',
    })
    expect(originalTxAfterRestart).toMatchObject({
      txId: 'tx-123',
    })
  })

  test('should handle concurrent database operations', async () => {
    const accounts = Array.from({ length: 100 }, (_, i) => ({
      ...mockAccount,
      accountId: `acc-${i}`,
      data: {
        ...mockAccount.data,
        ethAddress: `0x${i.toString().padStart(40, '0')}`,
      },
    }))

    const insertPromises = accounts.map(account => AccountStorage.insertAccount(account))
    await Promise.all(insertPromises)

    const queryPromises = accounts.map(account => 
      AccountStorage.queryAccountByAccountId(account.accountId)
    )
    const results = await Promise.all(queryPromises)

    expect(results).toHaveLength(100)
    results.forEach((result, index) => {
      expect(result).toMatchObject({
        accountId: `acc-${index}`,
      })
    })
  })

  test('should maintain data integrity across multiple restarts', async () => {
    for (let i = 0; i < 5; i++) {
      const cycle = { ...mockCycle, counter: i + 1, cycleMarker: `cycle-${i + 1}` }
      await CycleStorage.insertCycle(cycle)
    }

    let allCycles = await CycleStorage.queryCycleByMarker('cycle-3')
    expect(allCycles).toMatchObject({ counter: 3 })

    for (let restart = 0; restart < 3; restart++) {
      await new Promise<void>((resolve, reject) => {
        db.db.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      await db.init()

      const cycleCount = await CycleStorage.queryCycleCount()
      expect(cycleCount).toBe(5)

      const latestCycle = await CycleStorage.queryLatestCycleCounter()
      expect(latestCycle).toBe(5)
    }
  })

  test('should handle database file corruption recovery', async () => {
    await AccountStorage.insertAccount(mockAccount)
    
    const accountBefore = await AccountStorage.queryAccountByAccountId('acc-123')
    expect(accountBefore).toBeTruthy()

    await new Promise<void>((resolve, reject) => {
      db.db.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    fs.copyFileSync(testDbPath, testDbPath2)

    const dbContent = fs.readFileSync(testDbPath)
    const corruptedContent = Buffer.concat([
      dbContent.slice(0, 100),
      Buffer.from('CORRUPTED_DATA'),
      dbContent.slice(100),
    ])
    fs.writeFileSync(testDbPath, corruptedContent)

    try {
      await db.init()
    } catch (error) {
      fs.copyFileSync(testDbPath2, testDbPath)
      await db.init()
    }

    const accountAfterRecovery = await AccountStorage.queryAccountByAccountId('acc-123')
    expect(accountAfterRecovery).toBeTruthy()
  })

  test('should handle bulk operations and transactions', async () => {
    const accounts = Array.from({ length: 1000 }, (_, i) => ({
      ...mockAccount,
      accountId: `bulk-acc-${i}`,
      cycleNumber: Math.floor(i / 100) + 1,
    }))

    await AccountStorage.bulkInsertAccounts(accounts)

    const count = await AccountStorage.queryAccountCount()
    expect(count).toBe(1000)

    const page1 = await AccountStorage.queryAccounts(1, 100)
    const page2 = await AccountStorage.queryAccounts(2, 100)

    expect(page1).toHaveLength(100)
    expect(page2).toHaveLength(100)
    expect(page1[0].accountId).not.toBe(page2[0].accountId)
  })

  test('should maintain referential integrity', async () => {
    await CycleStorage.insertCycle(mockCycle)
    await TransactionStorage.insertTransaction(mockTransaction)
    await ReceiptStorage.insertReceipt(mockReceipt, mockReceipt.executionShardKey)

    const receipt = await ReceiptStorage.queryReceiptByTxId('tx-123')
    expect(receipt).toBeTruthy()
    expect(receipt.txId).toBe('tx-123')
    expect(receipt.cycle).toBe(1)

    const tx = await TransactionStorage.queryTransactionByTxId('tx-123')
    expect(tx).toBeTruthy()
    expect(tx.cycle).toBe(1)

    const cycle = await CycleStorage.queryCycleByCounter(1)
    expect(cycle).toBeTruthy()
  })

  test('should handle database migration scenarios', async () => {
    await AccountStorage.insertAccount(mockAccount)

    const oldSchema = await new Promise<any[]>((resolve, reject) => {
      db.db.all("PRAGMA table_info(accounts)", (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })

    await new Promise<void>((resolve, reject) => {
      db.db.run("ALTER TABLE accounts ADD COLUMN new_field TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) reject(err)
        else resolve()
      })
    })

    const newSchema = await new Promise<any[]>((resolve, reject) => {
      db.db.all("PRAGMA table_info(accounts)", (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })

    const hasNewField = newSchema.some(col => col.name === 'new_field')
    expect(newSchema.length).toBeGreaterThanOrEqual(oldSchema.length)

    const account = await AccountStorage.queryAccountByAccountId('acc-123')
    expect(account).toBeTruthy()
  })

  test('should handle database size growth and vacuum', async () => {
    const largeAccounts = Array.from({ length: 5000 }, (_, i) => ({
      ...mockAccount,
      accountId: `large-acc-${i}`,
      data: {
        ...mockAccount.data,
        largeField: 'x'.repeat(1000),
      },
    }))

    await AccountStorage.bulkInsertAccounts(largeAccounts)

    const statsBefore = fs.statSync(testDbPath)
    const sizeBefore = statsBefore.size

    await new Promise<void>((resolve, reject) => {
      db.db.run("DELETE FROM accounts WHERE accountId LIKE 'large-acc-%'", (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise<void>((resolve, reject) => {
      db.db.run("VACUUM", (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const statsAfter = fs.statSync(testDbPath)
    const sizeAfter = statsAfter.size

    expect(sizeAfter).toBeLessThan(sizeBefore)

    const remainingCount = await AccountStorage.queryAccountCount()
    expect(remainingCount).toBe(0)
  })
})