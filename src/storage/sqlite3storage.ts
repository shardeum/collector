import Database from 'better-sqlite3'
import { config } from '../config'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { Client } from 'pg'

let db: Database
let pgDefaultClient: Client
let pgIndexerClient: Client

// Additional databases
let shardeumIndexerDb: Database

// Column names that need proper casing in PostgreSQL
const COLUMN_EXCHANGER = [
  'accountId',
  'accountType',
  'afterStateHash',
  'afterStates',
  'amountSpent',
  'amountSpent_decimal',
  'appReceiptData',
  'applyTimestamp',
  'beforeStateHash',
  'beforeStates',
  'blockHash',
  'blockNumber',
  'contractAddress',
  'contractInfo',
  'contractType',
  'cycle',
  'cycleMarker',
  'cycleRecord',
  'ethAddress',
  'eventName',
  'executionShardKey',
  'globalModification',
  'hash',
  'internalTx',
  'internalTXType',
  'isGlobal',
  'isInternalTx',
  'nominee',
  'numberHex',
  'originalTxData',
  'readableBlock',
  'receiptId',
  'signedReceipt',
  'timestamp',
  'tokenEvent',
  'tokenFrom',
  'tokenOperator',
  'tokenTo',
  'tokenType',
  'tokenValue',
  'transactionType',
  'transactionFee',
  'transactionHash',
  'tx',
  'txFrom',
  'txHash',
  'txId',
  'txTo',
  'wrappedEVMAccount',
]

export type DbName = 'default' | 'shardeumIndexer'

export interface DbOptions {
  defaultDbSqlitePath: string
  enableShardeumIndexer: boolean
  shardeumIndexerSqlitePath: string
  pgConfig?: {
    user: string
    host: string
    database: string
    password: string
    port: number
  }
}

export async function init(options: DbOptions): Promise<void> {
  try {
    if (config.postgresEnabled) {
      // Initialize PostgreSQL connections
      try {
        // Default database connection
        pgDefaultClient = new Client({
          connectionString: config.pgDefaultDBConnectionString,
        })

        await pgDefaultClient.connect()
        pgDefaultClient.on('error', (err) => {
          console.error('PostgreSQL default DB encountered an error', err.stack)
        })

        console.log('PostgreSQL default database initialized.')

        // Indexer database connection (if enabled)
        if (options.enableShardeumIndexer) {
          try {
            pgIndexerClient = new Client({
              connectionString: config.pgShardeumIndexerDBConnectionString,
            })

            await pgIndexerClient.connect()
            pgIndexerClient.on('error', (err) => {
              console.error('PostgreSQL indexer DB encountered an error', err.stack)
            })

            console.log('PostgreSQL indexer database initialized.')
          } catch (indexerErr) {
            console.error('Failed to initialize PostgreSQL indexer database:', indexerErr)
            console.warn('Will use SQLite for shardeumIndexer operations')

            // Initialize SQLite for the indexer only
            try {
              shardeumIndexerDb = new Database(options.shardeumIndexerSqlitePath)
              run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
              run('PRAGMA busy_timeout = 5000', [], 'shardeumIndexer')
              console.log('SQLite Shardeum indexer database initialized as fallback.')
            } catch (sqliteErr) {
              console.error('Failed to initialize SQLite fallback for indexer:', sqliteErr)
              // Create in-memory SQLite as a last resort
              shardeumIndexerDb = new Database(':memory:')
              console.log('In-memory SQLite database created for indexer as a last resort.')
            }
          }
        }

        return // Successfully initialized PostgreSQL (at least the default DB)
      } catch (err) {
        console.error('Failed to initialize PostgreSQL default database:', err)
        throw err
      }
    }

    // If we reach here, we're using SQLite (either by choice or as fallback)
    db = new Database(options.defaultDbSqlitePath)
    run('PRAGMA journal_mode=WAL')
    run('PRAGMA busy_timeout = 5000') // Set busy timeout to 5 seconds
    console.log('SQLite database initialized.')

    if (options.enableShardeumIndexer) {
      shardeumIndexerDb = new Database(options.shardeumIndexerSqlitePath)
      run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
      run('PRAGMA busy_timeout = 5000', [], 'shardeumIndexer')
      console.log('SQLite Shardeum indexer database initialized.')
    }
  } catch (err) {
    console.error('Failed to initialize any database:', err)
    throw err
  }
}

function getDb(dbName: DbName): Database {
  if (dbName === 'default') {
    // Ensure SQLite database is initialized for default database
    if (!db) {
      throw new Error('SQLite database not initialized')
    }
    return db
  } else if (dbName === 'shardeumIndexer') {
    // Ensure SQLite database is initialized for shardeumIndexer
    if (!shardeumIndexerDb) {
      if (config.postgresEnabled && config.enableShardeumIndexer) {
        // Create a temporary in-memory SQLite database for shardeumIndexer if PG is enabled but SQLite isn't
        console.warn('Creating in-memory SQLite database for shardeumIndexer on demand')
        shardeumIndexerDb = new Database(':memory:')
        // No need to run PRAGMA commands on in-memory database
      } else {
        throw new Error('Shardeum indexer database not initialized')
      }
    }
    return shardeumIndexerDb
  }

  throw new Error(`Unknown database name: ${dbName}`)
}

function getClient(dbName: DbName): Client {
  switch (dbName) {
    case 'default':
      return pgDefaultClient
    case 'shardeumIndexer':
      return pgIndexerClient
  }
}

function fixSQLCasing(sql: string): string {
  // Only apply casing fixes for PostgreSQL
  if (config.postgresEnabled) {
    let fixedSql = sql

    // Fix table names: wrap only full table names in double quotes, not substrings
    // This will match FROM, JOIN, UPDATE, INTO, etc. followed by a table name (optionally with "s" at the end)
    // and wrap the table name in double quotes if not already quoted
    const tableNames = [
      'cycles',
      'blocks',
      'accounts',
      'tokens',
      'transactions',
      'receipts',
      'accounthistorystate',
      'originaltxsdata',
      'originaltxsdata2',
    ]
    for (const table of tableNames) {
      // Only match unquoted table names (not already in double quotes)
      // Use word boundary to avoid partial matches
      // e.g. FROM cycles, JOIN cycles, UPDATE cycles, INTO cycles
      // Also match "tableName"s (with s at the end)
      // Don't match if already quoted
      const regex = new RegExp(`\\b(${table})\\b(?!")`, 'g')
      fixedSql = fixedSql.replace(regex, `"${table}"`)
    }

    // Fix column names: wrap only unquoted column names in double quotes
    // Only match column names as whole words, not substrings, and not already quoted
    for (const column of COLUMN_EXCHANGER) {
      // Only match unquoted column names (not already in double quotes)
      // Use word boundary to avoid partial matches
      // Don't match if already quoted
      const regex = new RegExp(`\\b(${column})\\b(?!")`, 'g')
      fixedSql = fixedSql.replace(regex, `"${column}"`)
    }
    return fixedSql
  }
  return sql
}

function preparePgSQL(sql: string): string {
  // Convert SQLite syntax to PostgreSQL syntax
  let pgSQL = sql
    // Replace backticks with double quotes for identifiers
    .replace(/`([^`]+)`/g, '"$1"')
    // Replace AUTOINCREMENT with SERIAL
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    // Replace SQLite JSON type with JSONB for PostgreSQL
    .replace(/JSON/g, 'JSONB')
    // Replace NUMBER with BIGINT
    .replace(/NUMBER/g, 'BIGINT')
    // Replace if not exists syntax (PostgreSQL uses lowercase)
    .replace(/IF NOT EXISTS/gi, 'IF NOT EXISTS')

  // Generic handling for INSERT OR REPLACE
  if (pgSQL.includes('INSERT OR REPLACE INTO')) {
    // Extract table name, fields and values
    const insertMatch = pgSQL.match(/INSERT OR REPLACE INTO ([^\s]+) \(([^)]+)\) VALUES/)
    if (insertMatch) {
      const tableName = insertMatch[1].replace(/"/g, '')
      const fieldsStr = insertMatch[2]
      const fields = fieldsStr.split(',').map((f) => f.trim().replace(/"/g, ''))

      // Create ON CONFLICT clause for PostgreSQL
      // Try to determine the primary key fields
      let primaryKeyFields: string[] = []

      // Common primary key patterns
      if (
        tableName.includes('accounthistorystate') ||
        tableName.includes('originaltxsdata') ||
        tableName.includes('originaltxsdata2')
      ) {
        primaryKeyFields = ['"accountId"', '"timestamp"']
      } else if (tableName.includes('receipts')) {
        primaryKeyFields = ['"receiptId"']
      } else if (tableName.includes('transactions')) {
        primaryKeyFields = ['"txId"', '"txHash"']
      } else if (tableName.includes('accounts')) {
        primaryKeyFields = ['"accountId"']
      } else if (tableName.includes('tokens')) {
        primaryKeyFields = ['"ethAddress"', '"contractAddress"']
      } else if (tableName.includes('cycles')) {
        primaryKeyFields = ['"cycleMarker"']
      } else if (tableName.includes('blocks')) {
        primaryKeyFields = ['"number"']
      } else {
        // Default to first field as primary key if no specific match
        primaryKeyFields = [`"${fields[0]}"`]
      }

      // Create update clause for all fields
      const updateFields = fields.map((field) => `"${field}" = EXCLUDED."${field}"`).join(', ')

      // Replace INSERT OR REPLACE with standard INSERT
      pgSQL = pgSQL.replace(/INSERT OR REPLACE INTO ([^\s]+) \(([^)]+)\) VALUES/, `INSERT INTO $1 ($2) VALUES`)

      // Add ON CONFLICT clause if not already present
      if (!pgSQL.includes('ON CONFLICT')) {
        // Multi-row inserts handling
        const valuesMatch = pgSQL.match(/(VALUES\s*\([^)]+\))(,|\s|$)/)
        if (valuesMatch && valuesMatch[1]) {
          const valuesClause = valuesMatch[1]
          const afterValues = pgSQL.substring(pgSQL.indexOf(valuesClause) + valuesClause.length)

          // If it's a multi-row insert, add ON CONFLICT at the end
          if (afterValues.trim().startsWith(',')) {
            const lastCloseParenIndex = pgSQL.lastIndexOf(')')
            if (lastCloseParenIndex !== -1) {
              pgSQL =
                pgSQL.substring(0, lastCloseParenIndex + 1) +
                ` ON CONFLICT(${primaryKeyFields.join(', ')}) DO UPDATE SET ${updateFields}`
            }
          } else {
            // For single row inserts
            pgSQL = pgSQL.replace(
              valuesClause,
              `${valuesClause} ON CONFLICT(${primaryKeyFields.join(', ')}) DO UPDATE SET ${updateFields}`
            )
          }
        }
      }
    }
  }

  // Convert SQLite parameter placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
  let paramCount = 0
  pgSQL = pgSQL.replace(/\?/g, () => {
    paramCount++
    return `$${paramCount}`
  })
  return pgSQL
}

export function checkDatabaseHealth(dbName: DbName = 'default'): boolean {
  try {
    if (config.postgresEnabled) {
      // PostgreSQL health check
      const client = getClient(dbName)
      if (!client) return false
      client.query('SELECT 1')
      return true
    } else {
      // SQLite health check
      const dbInstance = getDb(dbName)
      dbInstance.prepare('SELECT 1').get()
      return true
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

export async function runCreate(createStatement: string, dbName: DbName = 'default'): Promise<void> {
  if (config.postgresEnabled) {
    try {
      // Prepare SQL for PostgreSQL
      const pgStatement = preparePgSQL(createStatement)

      // Special handling for shardeumIndexer database
      if (dbName === 'shardeumIndexer' && !pgIndexerClient) {
        // Fall back to SQLite for this specific operation
        console.log(`PostgreSQL client for ${dbName} not initialized, using SQLite for this operation`)

        // Make sure we have a SQLite database for shardeumIndexer
        if (!shardeumIndexerDb && config.enableShardeumIndexer) {
          console.warn('Initializing SQLite for shardeumIndexer on demand in runCreate')
          try {
            shardeumIndexerDb = new Database(config.shardeumIndexerSqlitePath)
            run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
            run('PRAGMA busy_timeout = 5000', [], 'shardeumIndexer')
          } catch (err) {
            console.error('Failed to initialize file-based SQLite for shardeumIndexer:', err)
            shardeumIndexerDb = new Database(':memory:')
            console.log('Created in-memory SQLite database for shardeumIndexer')
          }
        }

        // Check again if shardeumIndexerDb is initialized
        if (!shardeumIndexerDb) {
          throw new Error('Failed to initialize any SQLite database for Shardeum indexer')
        }

        run(createStatement, [], dbName)
        return
      }

      const client = getClient(dbName)
      if (!client) {
        throw new Error(`PostgreSQL client for ${dbName} not initialized`)
      }

      await client.query(pgStatement)
    } catch (err) {
      console.error('Error running SQL:', createStatement)
      console.error(err)
      throw err
    }
  } else {
    // Ensure SQLite database is initialized
    if (!db && dbName === 'default') {
      throw new Error('SQLite database not initialized')
    }

    if (dbName === 'shardeumIndexer' && !shardeumIndexerDb && config.enableShardeumIndexer) {
      throw new Error('Shardeum indexer SQLite database not initialized')
    }

    run(createStatement, [], dbName)
  }
}

export function run(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): { id: number } {
  try {
    if (config.postgresEnabled) {
      // For PostgreSQL, we need to handle this async function synchronously
      const pgSQL = preparePgSQL(fixSQLCasing(sql))
      // Special handling for shardeumIndexer database
      if (dbName === 'shardeumIndexer' && !pgIndexerClient) {
        // Fall back to SQLite for this specific operation
        console.log(`PostgreSQL client for ${dbName} not initialized, using SQLite for this operation`)

        // Make sure we have a SQLite database for shardeumIndexer
        if (!shardeumIndexerDb && config.enableShardeumIndexer) {
          console.warn('Initializing SQLite for shardeumIndexer on demand in run operation')
          try {
            shardeumIndexerDb = new Database(config.shardeumIndexerSqlitePath)
            try {
              shardeumIndexerDb.prepare('PRAGMA journal_mode=WAL').run()
              shardeumIndexerDb.prepare('PRAGMA busy_timeout = 5000').run()
            } catch (pragmaErr) {
              console.warn('Could not set PRAGMA settings on SQLite database:', pragmaErr)
            }
          } catch (err) {
            console.error('Failed to initialize file-based SQLite for shardeumIndexer:', err)
            shardeumIndexerDb = new Database(':memory:')
            console.log('Created in-memory SQLite database for shardeumIndexer')
          }
        }

        if (!shardeumIndexerDb) {
          throw new Error('Failed to initialize any SQLite database for Shardeum indexer')
        }

        const dbInstance = getDb(dbName)
        const info = dbInstance.prepare(sql).run(params)
        return { id: info.lastInsertRowid as number }
      }
      const client = getClient(dbName)
      if (!client) {
        throw new Error(`PostgreSQL client for ${dbName} not initialized`)
      }
      return client
        .query(pgSQL, Array.isArray(params) ? params : Object.values(params))
        .then((res) => {
          return res
        })
        .catch((err) => {
          console.error('Error running async SQL:', sql)
          console.error(err)
        })
    } else {
      // SQLite execution      console.log('=====>sqlite execution')
      const dbInstance = getDb(dbName)
      const info = dbInstance.prepare(sql).run(params)
      return { id: info.lastInsertRowid as number }
    }
  } catch (err) {
    console.error('Error running SQL:', sql)
    console.error(err)
    throw err
  }
}

// For SQLite, this returns the value synchronously
// For PostgreSQL, we still return synchronously but with a default/empty value
export function get<T>(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): T {
  try {
    if (config.postgresEnabled) {
      // Special handling for shardeumIndexer database
      if (dbName === 'shardeumIndexer' && !pgIndexerClient) {
        // Fall back to SQLite for this specific operation
        console.log(`PostgreSQL client for ${dbName} not initialized, using SQLite for this operation`)

        // Make sure we have a SQLite database for shardeumIndexer
        if (!shardeumIndexerDb && config.enableShardeumIndexer) {
          console.warn('Initializing SQLite for shardeumIndexer on demand in get operation')
          try {
            shardeumIndexerDb = new Database(config.shardeumIndexerSqlitePath)
            run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
            run('PRAGMA busy_timeout = 5000', [], 'shardeumIndexer')
          } catch (err) {
            console.error('Failed to initialize file-based SQLite for shardeumIndexer:', err)
            shardeumIndexerDb = new Database(':memory:')
            console.log('Created in-memory SQLite database for shardeumIndexer')
          }
        }

        // Check again if shardeumIndexerDb is initialized
        if (!shardeumIndexerDb) {
          throw new Error('Failed to initialize any SQLite database for Shardeum indexer')
        }

        const dbInstance = getDb(dbName)
        const result = dbInstance.prepare(sql).get(params) as any
        return deserializeDbRow<T>(result)
      }

      const pgSQL = preparePgSQL(fixSQLCasing(sql))
      const client = getClient(dbName)

      if (!client) {
        throw new Error(`PostgreSQL client for ${dbName} not initialized`)
      }
      return client
        .query(pgSQL, Array.isArray(params) ? params : Object.values(params))
        .then((res) => {
          if (res.rows && res.rows.length > 0) {
            // No need to deserialize for PostgreSQL as pg driver returns objects as-is
            return res.rows?.[0] as T
          }
          return null as unknown as T
        })
        .catch((err) => {
          console.error('Error running async SQL:', sql)
          console.error(err)
          return null as unknown as T
        })
    } else {
      // SQLite execution
      if (dbName === 'shardeumIndexer' && !shardeumIndexerDb && config.enableShardeumIndexer) {
        throw new Error('Shardeum indexer SQLite database not initialized')
      }
      const dbInstance = getDb(dbName)
      const result = dbInstance.prepare(sql).get(params) as any
      return deserializeDbRow<T>(result)
    }
  } catch (err) {
    console.error('Error running SQL:', sql)
    console.error(err)
    throw err
  }
}

// For SQLite, this returns the array synchronously
// For PostgreSQL, we still return synchronously but with an empty array
export function all<T>(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): T[] {
  try {
    if (config.postgresEnabled) {
      // Special handling for shardeumIndexer database
      if (dbName === 'shardeumIndexer' && !pgIndexerClient) {
        // Fall back to SQLite for this specific operation
        console.log(`PostgreSQL client for ${dbName} not initialized, using SQLite for this operation`)

        // Make sure we have a SQLite database for shardeumIndexer
        if (!shardeumIndexerDb && config.enableShardeumIndexer) {
          console.warn('Initializing SQLite for shardeumIndexer on demand in all operation')
          try {
            shardeumIndexerDb = new Database(config.shardeumIndexerSqlitePath)
            run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
            run('PRAGMA busy_timeout = 5000', [], 'shardeumIndexer')
          } catch (err) {
            console.error('Failed to initialize file-based SQLite for shardeumIndexer:', err)
            shardeumIndexerDb = new Database(':memory:')
            console.log('Created in-memory SQLite database for shardeumIndexer')
          }
        }

        // Check again if shardeumIndexerDb is initialized
        if (!shardeumIndexerDb) {
          throw new Error('Failed to initialize any SQLite database for Shardeum indexer')
        }

        const dbInstance = getDb(dbName)
        const results = dbInstance.prepare(sql).all(params) as any[]
        return results.map((row) => deserializeDbRow<T>(row)) as T[]
      }

      const pgSQL = preparePgSQL(fixSQLCasing(sql))
      const client = getClient(dbName)

      if (!client) {
        throw new Error(`PostgreSQL client for ${dbName} not initialized`)
      }
      return client
        .query(pgSQL, Array.isArray(params) ? params : Object.values(params))
        .then((res) => {
          if (res.rows && res.rows.length > 0) {
            // No need to deserialize for PostgreSQL as pg driver returns objects as-is
            return res.rows as T[]
          }
          return [] as T[]
        })
        .catch((err) => {
          console.error('Error running async SQL:', sql)
          console.error(err)
          return [] as T[]
        })
    } else {
      // SQLite execution
      if (dbName === 'shardeumIndexer' && !shardeumIndexerDb && config.enableShardeumIndexer) {
        throw new Error('Shardeum indexer SQLite database not initialized')
      }
      const dbInstance = getDb(dbName)
      const results = dbInstance.prepare(sql).all(params) as any[]
      return results.map((row) => deserializeDbRow<T>(row)) as T[]
    }
  } catch (err) {
    console.error('Error running SQL:', sql)
    console.error(err)
    throw err
  }
}

/**
 * Closes the Database and Indexer Connections Gracefully
 */
export function close(): void {
  try {
    console.log('Terminating Database/Indexer Connections...')

    if (config.postgresEnabled) {
      // Close PostgreSQL connections
      if (pgDefaultClient) {
        pgDefaultClient.end().catch((err) => {
          console.error('Error closing PostgreSQL default client:', err)
        })
        console.log('PostgreSQL default client connection closed.')
      }

      if (pgIndexerClient) {
        pgIndexerClient.end().catch((err) => {
          console.error('Error closing PostgreSQL indexer client:', err)
        })
        console.log('PostgreSQL indexer client connection closed.')
      }
    } else {
      // Close SQLite connections
      if (db) {
        db.close()
        console.log('SQLite database connection closed.')
      }

      if (config.enableShardeumIndexer && shardeumIndexerDb) {
        shardeumIndexerDb.close()
        console.log('Shardeum Indexer Database Connection closed.')
      }
    }
  } catch (err) {
    console.error('Error thrown in db close() function:')
    console.error(err)
  }
}

export function extractValues(object: object): unknown[] {
  try {
    const inputs: unknown[] = []
    for (let value of Object.values(object)) {
      if (value === null || value === undefined) {
        // Handle null values properly - keep them as null
        inputs.push(null)
      } else if (typeof value === 'object') {
        // Handle objects differently based on database type
        if (config.postgresEnabled) {
          // For PostgreSQL, if the value is already a string (already JSON), don't stringify it again
          if (typeof value === 'string') {
            inputs.push(value)
          } else {
            // Otherwise stringify the object for PostgreSQL JSONB columns
            inputs.push(StringUtils.safeStringify(value))
          }
        } else {
          // For SQLite, stringify all objects
          inputs.push(StringUtils.safeStringify(value))
        }
      } else {
        inputs.push(value)
      }
    }
    return inputs
  } catch (e) {
    console.log(e)
  }

  return []
}

export function extractValuesFromArray(arr: object[]): unknown[] {
  try {
    const inputs: unknown[] = []
    for (const object of arr) {
      for (let value of Object.values(object)) {
        if (value === null || value === undefined) {
          // Handle null values properly - keep them as null
          inputs.push(null)
        } else if (typeof value === 'object') {
          // Handle objects differently based on database type
          if (config.postgresEnabled) {
            // For PostgreSQL, if the value is already a string (already JSON), don't stringify it again
            if (typeof value === 'string') {
              inputs.push(value)
            } else {
              // Otherwise stringify the object for PostgreSQL JSONB columns
              inputs.push(StringUtils.safeStringify(value))
            }
          } else {
            // For SQLite, stringify all objects
            inputs.push(StringUtils.safeStringify(value))
          }
        } else if (typeof value === 'boolean') {
          value = value ? '1' : '0'
          inputs.push(value)
        } else {
          inputs.push(value)
        }
      }
    }
    return inputs
  } catch (e) {
    console.log(e)
  }

  return []
}

// Add a helper function to handle PostgreSQL JSON data conversion
export function deserializeDbRow<T>(row: any): T {
  if (!row) return null as unknown as T

  if (config.postgresEnabled) {
    // For each property in the row, check if it's a PostgreSQL JSON object
    for (const [key, value] of Object.entries(row)) {
      // If the value is actually an object (already parsed by pg driver)
      if (value !== null && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Buffer)) {
        // It's already an object from PostgreSQL, no need to parse
        row[key] = value
      }
      // If it's a string that could be JSON (from SQLite)
      else if (
        typeof value === 'string' &&
        (value.startsWith('{') || value.startsWith('[')) &&
        (value.endsWith('}') || value.endsWith(']'))
      ) {
        try {
          row[key] = StringUtils.safeJsonParse(value)
        } catch (e) {
          // Keep as string if parsing fails
          console.log('Failed to parse JSON string:', value, e)
        }
      }
    }
  } else {
    // For SQLite, parse string JSON fields
    for (const [key, value] of Object.entries(row)) {
      if (
        typeof value === 'string' &&
        (value.startsWith('{') || value.startsWith('[')) &&
        (value.endsWith('}') || value.endsWith(']'))
      ) {
        try {
          row[key] = StringUtils.safeJsonParse(value)
        } catch (e) {
          // Keep as string if parsing fails
          console.log('Failed to parse JSON string:', value, e)
        }
      }
    }
  }

  return row as T
}
