/* eslint-disable no-empty */
import * as db from './sqlite3storage'
import { extractValues, extractValuesFromArray } from './sqlite3storage'
import { config } from '../config/index'
import { isArray } from 'lodash'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { upsertSQL, bulkInsertSQL, ph, countStar, batchProcess } from './sqlHelpers'

export interface Log<L = object> {
  cycle: number
  timestamp: number
  txHash: string
  blockNumber: number
  blockHash: string
  contractAddress: string
  log: L
  topic0: string
  topic1?: string
  topic2?: string
  topic3?: string
}

export interface LogQueryRequest {
  address?: string
  topics?: unknown[]
  fromBlock?: number
  toBlock?: number
  blockHash?: string
}

type DbLog = Log & {
  log: string
}

export async function insertLog(log: Log): Promise<void> {
  try {
    const fields = Object.keys(log)
    const values = extractValues(log)
    const sql = upsertSQL('logs', fields, ['txHash', 'contractAddress', 'topic0'])
    db.run(sql, values)
    if (config.verbose) console.log('Successfully inserted Log', log.txHash, log.contractAddress)
  } catch (e) {
    console.log(e)
    console.log('Unable to insert Log or it is already stored in to database', log.txHash, log.contractAddress)
  }
}

export async function bulkInsertLogs(logs: Log[]): Promise<void> {
  try {
    // Empty logs check
    if (!logs || logs.length === 0) {
      return
    }

    const fields = Object.keys(logs[0])

    // Use the batchProcess helper
    await batchProcess({
      records: logs,
      tableName: 'logs',
      fields,
      uniqueFields: ['txHash', 'contractAddress', 'topic0'],
      extractValues: (log) => extractValues(log),
      extractBatchValues: (batch) => extractValuesFromArray(batch),
      dbRunFunction: async (sql, values) => {
        db.run(sql, values)
        return Promise.resolve()
      },
    })

    if (config.verbose) console.log('Successfully bulk inserted Logs', logs.length)
  } catch (e) {
    console.log(e)
    console.log('Unable to bulk insert Logs', logs.length)
  }
}

function buildLogQueryString(
  request: LogQueryRequest,
  countOnly: boolean,
  type: string
): { sql: string; values: unknown[] } {
  let sql
  const queryParams = []
  const values = []
  if (countOnly) {
    sql = `SELECT ${countStar()} FROM logs `
    if (type === 'txs') sql = `SELECT COUNT(DISTINCT(txHash)) FROM logs `
  } else {
    sql = 'SELECT * FROM logs '
  }
  const fromBlock = request.fromBlock
  const toBlock = request.toBlock
  if (fromBlock && toBlock) {
    queryParams.push(`blockNumber BETWEEN ${ph(values.length + 1)} AND ${ph(values.length + 2)}`)
    values.push(fromBlock, toBlock)
  } else if (request.blockHash) {
    queryParams.push(`blockHash=${ph(values.length + 1)}`)
    values.push(request.blockHash)
  }
  if (request.address) {
    queryParams.push(`contractAddress=${ph(values.length + 1)}`)
    values.push(request.address)
  }

  const createTopicQuery = (topicIndex: number, topicValue: unknown): void => {
    const hexPattern = /^0x[a-fA-F0-9]{64}$/
    if (Array.isArray(topicValue)) {
      const validHexValues = topicValue.filter((value) => typeof value === 'string' && hexPattern.test(value))
      if (validHexValues.length > 0) {
        const paramPlaceholders = validHexValues.map((_, i) => ph(values.length + i + 1)).join(',')
        const query = `topic${topicIndex} IN (${paramPlaceholders})`
        queryParams.push(query)
        values.push(...validHexValues)
      }
    } else if (typeof topicValue === 'string' && hexPattern.test(topicValue)) {
      queryParams.push(`topic${topicIndex}=${ph(values.length + 1)}`)
      values.push(topicValue)
    }
  }
  // Handling topics array
  if (Array.isArray(request.topics)) {
    request.topics.forEach((topic, index) => createTopicQuery(index, topic))
  }
  sql = `${sql}${queryParams.length > 0 ? ` WHERE ${queryParams.join(' AND ')}` : ''}`
  return { sql, values }
}

export async function queryLogCount(
  contractAddress?: string,
  topics?: unknown[],
  fromBlock?: number,
  toBlock?: number,
  blockHash?: string,
  type = undefined
): Promise<number> {
  let logs: { 'COUNT(txHash)': number } | { 'COUNT(DISTINCT(txHash))': number } = { 'COUNT(txHash)': 0 }
  try {
    const { sql, values: inputs } = buildLogQueryString(
      {
        address: contractAddress,
        topics,
        fromBlock,
        toBlock,
        blockHash,
      },
      true,
      type
    )
    if (config.verbose) console.log(sql, inputs)
    logs = await db.get(sql, inputs)
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Log count', logs)

  if (logs && type === 'txs') return logs['COUNT(DISTINCT(txHash))']
  else if (logs) return logs['COUNT(txHash)']
  else return 0
}

export async function queryLogs(
  skip = 0,
  limit = 10,
  contractAddress?: string,
  topics?: unknown[],
  fromBlock?: number,
  toBlock?: number,
  type?: string
): Promise<Log[]> {
  let logs: DbLog[] = []
  try {
    const { sql, values: inputs } = buildLogQueryString(
      {
        address: contractAddress,
        topics,
        fromBlock,
        toBlock,
      },
      false,
      type
    )
    let sqlQueryExtension = ` ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(inputs.length + 1)} OFFSET ${ph(
      inputs.length + 2
    )}`
    if (type === 'txs') {
      sqlQueryExtension = ` GROUP BY txHash` + sqlQueryExtension
    }
    if (config.verbose) console.log(sql, inputs)
    const allInputs = [...inputs, limit, skip]
    logs = await db.all(sql + sqlQueryExtension, allInputs)
    if (logs.length > 0) {
      logs.forEach((log: DbLog) => {
        if (log && log.log && typeof log.log === 'string') {
          ;(log as Log).log = StringUtils.safeJsonParse(log.log)
        }
      })
    }
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Log logs', logs)
  return logs
}

export async function queryLogCountBetweenCycles(startCycleNumber: number, endCycleNumber: number): Promise<number> {
  let logs: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT ${countStar()} FROM logs WHERE cycle BETWEEN ${ph(1)} AND ${ph(2)}`
    logs = await db.get(sql, [startCycleNumber, endCycleNumber])
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) {
    console.log('Log count between cycle', logs)
  }

  return logs['COUNT(*)'] || 0
}

export async function queryLogsBetweenCycles(
  skip = 0,
  limit = 10000,
  startCycleNumber: number,
  endCycleNumber: number
): Promise<Log[]> {
  let logs: DbLog[] = []
  try {
    const sql = `SELECT * FROM logs WHERE cycle BETWEEN ${ph(1)} AND ${ph(
      2
    )} ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(3)} OFFSET ${ph(4)}`
    logs = await db.all(sql, [startCycleNumber, endCycleNumber, limit, skip])
    if (logs.length > 0) {
      logs.forEach((log: DbLog) => {
        if (log && log.log && typeof log.log === 'string') {
          ;(log as Log).log = StringUtils.safeJsonParse(log.log)
        }
      })
    }
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) {
    console.log('Log logs between cycles', logs ? logs.length : logs, 'skip', skip)
  }

  return logs
}

export type LogFilter = {
  address: string[]
  topics: string[]
  fromBlock: string
  toBlock: string
  blockHash?: string
}

export async function queryLogsByFilter(logFilter: LogFilter, limit = 5000): Promise<Log[]> {
  let logs: DbLog[] = []
  const queryParams = []

  function createSqlFromEvmLogFilter(filter: LogFilter): string {
    const { fromBlock, toBlock, address, topics, blockHash } = filter
    let paramCount = 1

    let sql = `SELECT log FROM logs WHERE 1 = 1`

    if (isArray(address) && address.length > 0) {
      const placeholders = address.map(() => ph(paramCount++)).join(',')
      sql += ` AND contractAddress IN (${placeholders})`
      for (const addr of address) {
        queryParams.push(addr.toLowerCase())
      }
    }

    if (blockHash) {
      sql += ` AND blockHash = ${ph(paramCount++)}`
      queryParams.push(blockHash.toLowerCase())
    } else {
      if (fromBlock == 'latest') {
        sql += ` AND blockNumber >= (
                        SELECT MAX(blockNumber)
                        FROM logs
                  )`
      }
      if (fromBlock == 'earliest') {
        // genesis block
        sql += ` AND blockNumber >= 0`
      }
      if (fromBlock && fromBlock !== 'latest' && fromBlock !== 'earliest') {
        sql += ` AND blockNumber >= ${ph(paramCount++)}`
        queryParams.push(Number(fromBlock))
      }

      if (toBlock == 'latest') {
        sql += ` AND blockNumber <= (
                        SELECT MAX(blockNumber)
                        FROM logs
                  )`
      }
      if (toBlock == 'earliest') {
        // genesis block
        sql += ` AND blockNumber <= 0`
      }
      if (toBlock && toBlock !== 'latest' && toBlock !== 'earliest') {
        sql += ` AND blockNumber <= ${ph(paramCount++)}`
        queryParams.push(Number(toBlock))
      }
    }

    if (topics[0]) {
      sql += ` AND topic0 = ${ph(paramCount++)}`
      queryParams.push(topics[0].toLowerCase())
    }
    if (topics[1]) {
      sql += ` AND topic1 = ${ph(paramCount++)}`
      queryParams.push(topics[1].toLowerCase())
    }
    if (topics[2]) {
      sql += ` AND topic2 = ${ph(paramCount++)}`
      queryParams.push(topics[2].toLowerCase())
    }
    if (topics[3]) {
      sql += ` AND topic3 = ${ph(paramCount++)}`
      queryParams.push(topics[3].toLowerCase())
    }
    sql += ` ORDER BY blockNumber ASC LIMIT ${ph(paramCount++)};`
    queryParams.push(limit)

    if (config.verbose) console.log(`queryLogsByFilter: Query: `, sql, queryParams)
    return sql
  }
  const sql = createSqlFromEvmLogFilter(logFilter)
  logs = await db.all(sql, queryParams)
  if (logs.length > 0) {
    logs.forEach((log: DbLog) => {
      if (log && log.log && typeof log.log === 'string') {
        ;(log as Log).log = StringUtils.safeJsonParse(log.log)
      }
    })
  }

  return logs
}
