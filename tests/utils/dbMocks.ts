import Database from 'better-sqlite3'
import { join } from 'path'

// Create an in-memory SQLite database for testing
export const createTestDatabase = (): Database.Database => {
  const db = new Database(':memory:')

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON')

  return db
}

// Initialize database schema for testing
export const initializeTestSchema = (db: Database.Database): void => {
  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      accountId TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      balance TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      codeHash TEXT,
      storageRoot TEXT,
      cycle INTEGER NOT NULL,
      data TEXT
    )
  `)

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      txId TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      cycleNumber INTEGER NOT NULL,
      blockNumber INTEGER,
      blockHash TEXT,
      from_address TEXT NOT NULL,
      to_address TEXT,
      value TEXT NOT NULL,
      gas TEXT NOT NULL,
      gasPrice TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      data TEXT,
      v TEXT,
      r TEXT,
      s TEXT,
      txHash TEXT NOT NULL,
      transactionIndex INTEGER,
      cumulativeGasUsed TEXT,
      gasUsed TEXT,
      logs TEXT,
      logsBloom TEXT,
      status INTEGER,
      contractAddress TEXT,
      sign TEXT
    )
  `)

  // Create receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      receiptId TEXT PRIMARY KEY,
      txId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      cycleNumber INTEGER NOT NULL,
      blockNumber INTEGER,
      blockHash TEXT,
      from_address TEXT NOT NULL,
      to_address TEXT,
      transactionHash TEXT NOT NULL,
      transactionIndex INTEGER,
      cumulativeGasUsed TEXT,
      gasUsed TEXT,
      logs TEXT,
      logsBloom TEXT,
      status INTEGER,
      contractAddress TEXT,
      sign TEXT,
      FOREIGN KEY (txId) REFERENCES transactions(txId)
    )
  `)

  // Create blocks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      number INTEGER PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      parentHash TEXT NOT NULL,
      nonce TEXT,
      sha3Uncles TEXT,
      logsBloom TEXT,
      transactionsRoot TEXT,
      stateRoot TEXT,
      receiptsRoot TEXT,
      miner TEXT,
      difficulty TEXT,
      totalDifficulty TEXT,
      extraData TEXT,
      size TEXT,
      gasLimit TEXT,
      gasUsed TEXT,
      timestamp INTEGER NOT NULL,
      transactions TEXT,
      uncles TEXT,
      baseFeePerGas TEXT
    )
  `)

  // Create cycles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cycles (
      cycleNumber INTEGER PRIMARY KEY,
      cycleMarker TEXT NOT NULL,
      cycleRecord TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `)

  // Create originalTxsData table
  db.exec(`
    CREATE TABLE IF NOT EXISTS originalTxsData (
      txId TEXT PRIMARY KEY,
      originalTxData TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      sign TEXT
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_accounts_timestamp ON accounts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
    CREATE INDEX IF NOT EXISTS idx_transactions_blockNumber ON transactions(blockNumber);
    CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_receipts_txId ON receipts(txId);
    CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
    CREATE INDEX IF NOT EXISTS idx_cycles_timestamp ON cycles(timestamp);
  `)
}

// Database operation mocks
export const createMockDbOperations = () => {
  const mockRun = jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
  const mockGet = jest.fn()
  const mockAll = jest.fn().mockReturnValue([])
  const mockPrepare = jest.fn().mockReturnValue({
    run: mockRun,
    get: mockGet,
    all: mockAll,
    finalize: jest.fn(),
  })

  return {
    run: mockRun,
    get: mockGet,
    all: mockAll,
    prepare: mockPrepare,
    exec: jest.fn(),
    close: jest.fn(),
    transaction: jest.fn((fn) => fn),
  }
}

// Create a test database wrapper for easy cleanup
export class TestDatabase {
  private db: Database.Database | null = null

  initialize(): Database.Database {
    this.db = createTestDatabase()
    initializeTestSchema(this.db)
    return this.db
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.db
  }

  cleanup(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Helper to create a mock database connection
export const createMockDbConnection = () => {
  const db = createMockDbOperations()
  return {
    ...db,
    pragma: jest.fn(),
    backup: jest.fn(),
    function: jest.fn(),
    aggregate: jest.fn(),
    loadExtension: jest.fn(),
    defaultSafeIntegers: jest.fn(),
    unsafeMode: jest.fn(),
  }
}
