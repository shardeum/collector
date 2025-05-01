import WebSocket from 'ws'
import { config } from '../config'
import * as db from './sqlite3storage'
import { DbOptions } from './sqlite3storage'
import { DbName } from './sqlite3storage'

export const isShardeumIndexerEnabled = (): boolean => {
  return config.enableShardeumIndexer
}

export const isBlockIndexingEnabled = (): boolean => {
  return config.blockIndexing.enabled
}

/**
 * Helper function to execute database operations with consistent error handling
 * @param operation - SQL operation to run
 * @param errorMessage - Custom error message
 * @param dbName - Optional database name for shardeum indexer
 */
async function executeDbOperation(operation: string, errorMessage: string, dbName?: DbName): Promise<void> {
  try {
    await db.runCreate(operation, dbName)
  } catch (err) {
    console.error(`${errorMessage}:`, err)
  }
}

export async function initializeDB(): Promise<void> {
  // Initialize the database with appropriate configuration
  const dbOptions: DbOptions = {
    defaultDbSqlitePath: config.dbPath,
    enableShardeumIndexer: config.enableShardeumIndexer,
    shardeumIndexerSqlitePath: config.shardeumIndexerSqlitePath,
  }

  // Add PostgreSQL configuration if enabled
  if (config.postgresEnabled) {
    console.log('PostgreSQL mode enabled')
    // Check if connection strings are provided
    if (!config.pgDefaultDBConnectionString) {
      console.warn('PostgreSQL connection string not provided, using default values')
    }

    // Default PostgreSQL configuration that can be overridden by environment variables
    dbOptions.pgConfig = {
      user: process.env.PG_USER || 'postgres',
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE || 'shardeum',
      password: process.env.PG_PASSWORD || 'postgres',
      port: parseInt(process.env.PG_PORT || '5432', 10),
    }

    if (config.verbose) console.log(`Connecting to PostgreSQL at ${dbOptions.pgConfig.host}:${dbOptions.pgConfig.port}`)
  }

  try {
    db.init(dbOptions)

    console.log('[my-log] Initializing database...')

    // Create tables and indexes
    const createCyclesTable =
      'CREATE TABLE if not exists `cycles` (`cycleMarker` TEXT NOT NULL UNIQUE PRIMARY KEY, `counter` NUMBER NOT NULL, `cycleRecord` JSON NOT NULL)'
    await executeDbOperation(createCyclesTable, 'Error creating cycles table')

    await executeDbOperation(
      'CREATE INDEX if not exists `cycles_idx` ON `cycles` (`counter` DESC)',
      'Error creating cycles index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `accounts` (`accountId` TEXT NOT NULL UNIQUE PRIMARY KEY, `cycle` NUMBER NOT NULL, `timestamp` BIGINT NOT NULL, `ethAddress` TEXT NOT NULL, `account` JSON NOT NULL, `accountType` INTEGER NOT NULL, `hash` TEXT NOT NULL, `isGlobal` BOOLEAN NOT NULL, `contractInfo` JSON, `contractType` INTEGER)',
      'Error creating accounts table'
    )

    if (isShardeumIndexerEnabled()) {
      console.log('ShardeumIndexer: Enabled, creating tables and indexes for ShardeumIndexer')
      await executeDbOperation(
        'CREATE TABLE if not exists `accountsEntry` (`accountId` TEXT NOT NULL UNIQUE PRIMARY KEY, `timestamp` BIGINT NOT NULL, `data` TEXT NOT NULL)',
        'Error creating shardeumIndexer tables',
        'shardeumIndexer'
      )
    }

    if (isBlockIndexingEnabled()) {
      console.log('BlockIndexing: Enabled, creating tables and indexes for BlockIndexing')
      await executeDbOperation(
        'CREATE TABLE if not exists `blocks` (`number` NUMBER NOT NULL UNIQUE PRIMARY KEY, `numberHex` TEXT NOT NULL, `hash` TEXT NOT NULL, `timestamp` BIGINT NOT NULL, `cycle` NUMBER NOT NULL, `readableBlock` JSON NOT NULL)',
        'Error creating blocks table'
      )
      await executeDbOperation(
        `CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks (hash)`,
        'Error creating blocks hash index'
      )
      await executeDbOperation(
        `CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks (timestamp)`,
        'Error creating blocks timestamp index'
      )
    }

    await executeDbOperation(
      'CREATE INDEX if not exists `accounts_idx` ON `accounts` (`cycle` DESC, `timestamp` DESC, `accountType` ASC, `ethAddress`, `contractInfo`, `contractType` ASC)',
      'Error creating accounts index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `transactions` (`txId` TEXT NOT NULL, `cycle` NUMBER NOT NULL, `timestamp` BIGINT NOT NULL, `blockNumber` NUMBER NOT NULL, `blockHash` TEXT NOT NULL, `wrappedEVMAccount` JSON NOT NULL, `txFrom` TEXT NOT NULL, `txTo` TEXT NOT NULL, `nominee` TEXT, `txHash` TEXT NOT NULL, `transactionType` INTEGER NOT NULL, `originalTxData` JSON, `internalTXType` INTEGER, PRIMARY KEY (`txId`, `txHash`))',
      'Error creating transactions table'
    )

    // Check if 'internalTXType' column exists on transactions table
    // Use database-agnostic approach to check for column existence
    let columnExists = false

    try {
      if (config.postgresEnabled) {
        // PostgreSQL syntax to check if column exists
        const checkColumnSql = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='transactions' AND column_name='internalTXType'
        `

        const result = db.get<{ column_name?: string }>(checkColumnSql)
        columnExists = !!result && !!result.column_name
      } else {
        // SQLite syntax to check if column exists
        const result = db.all<{ name: string }>('PRAGMA table_info(transactions)')
        columnExists = result.some((row) => row && row.name === 'internalTXType')
      }
    } catch (err) {
      console.error('Error checking for internalTXType column:', err)
      columnExists = true // Assume it exists to avoid errors
    }

    if (!columnExists) {
      console.log("Adding missing column 'internalTXType' to transactions table...")

      try {
        // Add the new column - ALTER TABLE syntax is compatible with both SQLite and PostgreSQL
        db.run('ALTER TABLE transactions ADD COLUMN internalTXType INTEGER')
        console.log("Column 'internalTXType' added successfully.")
      } catch (err) {
        console.error("Error adding 'internalTXType' column:", err)
        console.log('Column likely already exists or cannot be added. Continuing...')
      }
    } else {
      console.log("Column 'internalTXType' already exists.")
    }

    // Create remaining indexes and tables with error handling
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_hash_id` ON `transactions` (`txHash`, `txId`)',
      'Error creating transactions_hash_id index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_txType` ON `transactions` (`transactionType`)',
      'Error creating transactions_txType index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_txFrom` ON `transactions` (`txFrom`)',
      'Error creating transactions_txFrom index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_txTo` ON `transactions` (`txTo`)',
      'Error creating transactions_txTo index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_nominee` ON `transactions` (`nominee`)',
      'Error creating transactions_nominee index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_cycle_timestamp` ON `transactions` (`cycle` DESC, `timestamp` DESC)',
      'Error creating transactions_cycle_timestamp index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_blockHash` ON `transactions` (`blockHash`)',
      'Error creating transactions_blockHash index'
    )
    await executeDbOperation(
      'CREATE INDEX if not exists `transactions_blockNumber` ON `transactions` (`blockNumber`)',
      'Error creating transactions_blockNumber index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `tokenTxs` (`txId` TEXT NOT NULL, `txHash` TEXT NOT NULL, `cycle` NUMBER NOT NULL, `timestamp` BIGINT NOT NULL, `contractAddress` TEXT NOT NULL, `contractInfo` JSON, `tokenFrom` TEXT NOT NULL, `tokenTo` TEXT NOT NULL, `tokenValue` TEXT NOT NULL, `tokenType` INTEGER NOT NULL, `tokenEvent` TEXT NOT NULL, `tokenOperator` TEXT, `transactionFee` TEXT NOT NULL, FOREIGN KEY (`txId`, `txHash`) REFERENCES transactions(`txId`, `txHash`))',
      'Error creating tokenTxs table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `tokenTxs_idx` ON `tokenTxs` (`cycle` DESC, `timestamp` DESC, `txId`, `txHash`, `contractAddress`, `tokenFrom`, `tokenTo`, `tokenType`, `tokenOperator`)',
      'Error creating tokenTxs_idx index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `tokens` (`ethAddress` TEXT NOT NULL, `contractAddress` TEXT NOT NULL, `tokenType` INTEGER NOT NULL, `tokenValue` TEXT NOT NULL, PRIMARY KEY (`ethAddress`, `contractAddress`))',
      'Error creating tokens table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `tokens_idx` ON `tokens` (`ethAddress`, `contractAddress`, `tokenType`, `tokenValue` DESC)',
      'Error creating tokens_idx index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `logs` (`_id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `txHash` TEXT NOT NULL, `cycle` NUMBER NOT NULL, `timestamp` BIGINT NOT NULL, `blockNumber` NUMBER NOT NULL, `blockHash` TEXT NOT NULL, `contractAddress` TEXT NOT NULL,' +
        ' `log` JSON NOT NULL, `topic0` TEXT NOT NULL, `topic1` TEXT, `topic2` TEXT, `topic3` TEXT)',
      'Error creating logs table'
    )

    await executeDbOperation(
      'CREATE INDEX IF NOT EXISTS `logs_cycle_timestamp` ON `logs` (`cycle` DESC, `timestamp` DESC)',
      'Error creating logs_cycle_timestamp index'
    )
    await executeDbOperation(
      'CREATE INDEX IF NOT EXISTS `logs_contractAddress` ON `logs` (`contractAddress`)',
      'Error creating logs_contractAddress index'
    )
    await executeDbOperation(
      'CREATE INDEX IF NOT EXISTS `logs_blockHash` ON `logs` (`blockHash`)',
      'Error creating logs_blockHash index'
    )
    await executeDbOperation(
      'CREATE INDEX IF NOT EXISTS `logs_blockNumber` ON `logs` (`blockNumber` DESC)',
      'Error creating logs_blockNumber index'
    )
    await executeDbOperation(
      'CREATE INDEX IF NOT EXISTS `logs_topic` ON `logs` (`topic0`, `topic1`, `topic2`, `topic3`)',
      'Error creating logs_topic index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `receipts` (`receiptId` TEXT NOT NULL UNIQUE PRIMARY KEY, `tx` JSON NOT NULL, `cycle` NUMBER NOT NULL, `applyTimestamp` BIGINT NOT NULL, `timestamp` BIGINT NOT NULL, `signedReceipt` JSON NOT NULL, `afterStates` JSON, `beforeStates` JSON, `appReceiptData` JSON, `executionShardKey` TEXT NOT NULL, `globalModification` BOOLEAN NOT NULL)',
      'Error creating receipts table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `receipts_idx` ON `receipts` (`cycle` ASC, `timestamp` ASC)',
      'Error creating receipts_idx index'
    )

    // Main originalTxData
    await executeDbOperation(
      'CREATE TABLE if not exists `originalTxsData` (`txId` TEXT NOT NULL, `timestamp` BIGINT NOT NULL, `cycle` NUMBER NOT NULL, `originalTxData` JSON NOT NULL, PRIMARY KEY (`txId`, `timestamp`))',
      'Error creating originalTxsData table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `originalTxsData_idx` ON `originalTxsData` (`cycle` ASC, `timestamp` ASC, `txId`)',
      'Error creating originalTxsData_idx index'
    )

    // Mapped OriginalTxData with txHash and transactionType
    await executeDbOperation(
      'CREATE TABLE if not exists `originalTxsData2` (`txId` TEXT NOT NULL, `txHash` TEXT NOT NULL, `timestamp` BIGINT NOT NULL, `cycle` NUMBER NOT NULL,  `transactionType` INTEGER NOT NULL, PRIMARY KEY (`txId`, `timestamp`))',
      'Error creating originalTxsData2 table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `originalTxsData2_idx` ON `originalTxsData2` (`txHash`, `txId`, `cycle` DESC, `timestamp` DESC, `transactionType`)',
      'Error creating originalTxsData2_idx index'
    )

    await executeDbOperation(
      'CREATE TABLE if not exists `accountHistoryState` (`accountId` TEXT NOT NULL, `beforeStateHash` TEXT NOT NULL, `afterStateHash` TEXT NOT NULL, `blockNumber` NUMBER NOT NULL, `blockHash` TEXT NOT NULL, `timestamp` BIGINT NOT NULL, `receiptId` TEXT NOT NULL, PRIMARY KEY (`accountId`, `timestamp`), UNIQUE (`accountId`, `blockNumber`))',
      'Error creating accountHistoryState table'
    )

    await executeDbOperation(
      'CREATE INDEX if not exists `accountHistoryState_idx` ON `accountHistoryState` (`accountId`, `blockHash`, `blockNumber` DESC, `timestamp` DESC)',
      'Error creating accountHistoryState_idx index'
    )

    // Table for checkpoints
    await executeDbOperation(
      'CREATE TABLE IF NOT EXISTS `checkpoint` (type TEXT UNIQUE NOT NULL, value INTEGER NOT NULL)',
      'Error creating checkpoint table'
    )
  } catch (err) {
    console.error('Failed to initialize database:', err)
    process.exit(1) // Exit process on database initialization failure
  }
}

export function closeDatabase(): void {
  db.close()
}

export const addExitListeners = (ws?: WebSocket) => {
  process.on('SIGINT', async () => {
    console.log('Exiting on SIGINT')
    if (ws) ws.close()
    await closeDatabase()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    console.log('Exiting on SIGTERM')
    if (ws) ws.close()
    await closeDatabase()
    process.exit(0)
  })
}
