import Database from 'better-sqlite3'
import { config } from '../config'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
let db: Database

// Additional databases
let shardeumIndexerDb: Database

export type DbName = 'default' | 'shardeumIndexer'

export interface DbOptions {
  defaultDbSqlitePath: string
  enableShardeumIndexer: boolean
  shardeumIndexerSqlitePath: string
}

export async function init(config: DbOptions): Promise<void> {
  db = new Database(config.defaultDbSqlitePath)
  run('PRAGMA journal_mode=WAL')
  run('PRAGMA busy_timeout = 5000') // Set busy timeout to 5 seconds
  console.log('Database initialized.')
  if (config.enableShardeumIndexer) {
    shardeumIndexerDb = new Database(config.shardeumIndexerSqlitePath)
    run('PRAGMA journal_mode=WAL', [], 'shardeumIndexer')
    console.log('Shardeum indexer database initialized.')
  }
  // NOT SUPPORTED IN BETTER-SQLITE3
  // db.on('profile', (sql, time) => {
  //   if (time > 500 && time < 1000) {
  //     console.log('SLOW QUERY', sql, time)
  //   } else if (time > 1000) {
  //     console.log('VERY SLOW QUERY', sql, time)
  //   }
  // })
}

function getDb(dbName: DbName): Database {
  switch (dbName) {
    case 'default':
      return db
    case 'shardeumIndexer':
      return shardeumIndexerDb
  }
}

export function checkDatabaseHealth(dbName: DbName = 'default'): boolean {
  try {
    // Run a simple SELECT to check if the database is responding
    getDb(dbName).prepare('SELECT 1').get()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

export async function runCreate(createStatement: string, dbName: DbName = 'default'): Promise<void> {
  run(createStatement, [], dbName)
}

export function run(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): { id: number } {
  try {
    const db = getDb(dbName)
    const stmt = db.prepare(sql)
    const result = stmt.run(params)

    return { id: result.lastInsertRowid as number }
  } catch (err) {
    console.error('Error running SQL:', sql)
    console.error(err)
    throw err
  }
}

export function get<T>(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): T {
  try {
    const db = getDb(dbName)
    return db.prepare(sql).get(params) as T
  } catch (err) {
    console.error('Error running SQL:', sql)
    console.error(err)
    throw err
  }
}

export function all<T>(sql: string, params: unknown[] | object = [], dbName: DbName = 'default'): T[] {
  try {
    const db = getDb(dbName)
    return db.prepare(sql).all(params) as T[]
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

    if (db) {
      db.close()
      console.log('Database connection closed.')
    }

    if (config.enableShardeumIndexer && shardeumIndexerDb) {
      shardeumIndexerDb.close()
      console.log('Shardeum Indexer Database Connection closed.')
    }
  } catch (err) {
    console.error('Error thrown in db close() function:')
    console.error(err)
  }
}

export function extractValues(object: object): string[] {
  try {
    const inputs: string[] = []
    for (let value of Object.values(object)) {
      if (typeof value === 'object') value = StringUtils.safeStringify(value)
      inputs.push(value)
    }
    return inputs
  } catch (e) {
    console.log(e)
  }

  return []
}

export function extractValuesFromArray(arr: object[]): string[] {
  try {
    const inputs: string[] = []
    for (const object of arr) {
      for (let value of Object.values(object)) {
        if (typeof value === 'object') value = StringUtils.safeStringify(value)
        else if (typeof value === 'boolean') value = value ? '1' : '0'
        inputs.push(value)
      }
    }
    return inputs
  } catch (e) {
    console.log(e)
  }

  return []
}
