import * as db from './sqlite3storage'
import { extractValues, extractValuesFromArray, deserializeDbRow } from './sqlite3storage'
import { Cycle } from '../types'
import { config } from '../config/index'
import { isBlockIndexingEnabled } from '.'
import { upsertBlocksForCycle, upsertBlocksForCycles } from './block'
import { cleanOldReceiptsMap } from './receipt'
import { cleanOldOriginalTxsMap } from './originalTxData'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { upsertSQL, rowPlaceholders, ph, bulkInsertSQL, countStar } from './sqlHelpers'

export let Collection: unknown

type DbCycle = Cycle & {
  cycleRecord: string
}

export function isCycle(obj: Cycle): obj is Cycle {
  return (obj as Cycle).cycleRecord !== undefined && (obj as Cycle).cycleMarker !== undefined
}

export async function insertCycle(cycle: Cycle): Promise<void> {
  try {
    // Clone the cycle object to avoid modifying the original
    const preparedCycle: any = { ...cycle }

    // If using PostgreSQL, we can keep the object as is
    // Otherwise, ensure cycleRecord is a JSON string for SQLite
    if (!config.postgresEnabled && typeof preparedCycle.cycleRecord === 'object') {
      preparedCycle.cycleRecord = StringUtils.safeStringify(preparedCycle.cycleRecord)
    }

    const fields = Object.keys(preparedCycle)
    const sql = upsertSQL('cycles', fields, ['cycleMarker'])
    const values = extractValues(preparedCycle)
    db.run(sql, values)

    if (config.verbose) console.log('Successfully inserted Cycle', cycle.cycleRecord.counter, cycle.cycleMarker)
    if (isBlockIndexingEnabled()) await upsertBlocksForCycle(cycle)
  } catch (e) {
    console.log(e)
    console.log(
      'Unable to insert cycle or it is already stored in to database',
      cycle.cycleRecord.counter,
      cycle.cycleMarker
    )
  }
}

export async function bulkInsertCycles(cycles: Cycle[]): Promise<void> {
  try {
    // Clone and prepare cycles for database-specific handling
    const preparedCycles = cycles.map((cycle) => {
      const clonedCycle: any = { ...cycle }

      // If using SQLite, ensure cycleRecord is a JSON string
      if (!config.postgresEnabled && typeof clonedCycle.cycleRecord === 'object') {
        clonedCycle.cycleRecord = StringUtils.safeStringify(clonedCycle.cycleRecord)
      }

      return clonedCycle
    })

    const fields = Object.keys(preparedCycles[0])
    const { sql } = bulkInsertSQL('cycles', fields, preparedCycles.length, ['cycleMarker'])
    const values = extractValuesFromArray(preparedCycles)
    db.run(sql, values)

    if (config.verbose) console.log('Successfully bulk inserted Cycles', cycles.length)
    if (isBlockIndexingEnabled()) await upsertBlocksForCycles(cycles)
  } catch (e) {
    console.log(e)
    console.log('Unable to bulk insert Cycles', cycles.length)
  }
}

export async function updateCycle(marker: string, cycle: Cycle): Promise<void> {
  try {
    const sql = `UPDATE cycles SET counter = ${ph(1)}, cycleRecord = ${ph(2)} WHERE cycleMarker = ${ph(3)} `

    const cycleRecordValue =
      config.postgresEnabled && typeof cycle.cycleRecord === 'object'
        ? cycle.cycleRecord
        : cycle.cycleRecord && StringUtils.safeStringify(cycle.cycleRecord)

    db.run(sql, [cycle.counter, cycleRecordValue, marker])

    if (config.verbose) console.log('Updated cycle for counter', cycle.cycleRecord.counter, cycle.cycleMarker)
    if (isBlockIndexingEnabled()) await upsertBlocksForCycle(cycle)
  } catch (e) {
    console.log(e)
    console.log('Unable to update Cycle', cycle.cycleMarker)
  }
}

export async function insertOrUpdateCycle(cycle: Cycle): Promise<void> {
  if (cycle && cycle.cycleRecord && cycle.cycleMarker) {
    const cycleInfo: Cycle = {
      counter: cycle.cycleRecord.counter,
      cycleRecord: cycle.cycleRecord,
      cycleMarker: cycle.cycleMarker,
    }
    const cycleExist = await queryCycleByMarker(cycle.cycleMarker)
    if (config.verbose) console.log('cycleExist', StringUtils.safeStringify(cycleExist))
    if (cycleExist) {
      if (StringUtils.safeStringify(cycleInfo) !== StringUtils.safeStringify(cycleExist)) {
        await updateCycle(cycleInfo.cycleMarker, cycleInfo)
      }
    } else {
      await insertCycle(cycleInfo)
      // Clean up receipts map that are older than 5 minutes
      const CLEAN_UP_TIMESTMAP_MS = Date.now() - 5 * 60 * 1000
      cleanOldReceiptsMap(CLEAN_UP_TIMESTMAP_MS)
      cleanOldOriginalTxsMap(CLEAN_UP_TIMESTMAP_MS)
    }
  } else {
    console.log('No cycleRecord or cycleMarker in cycle,', cycle)
  }
}

export async function queryLatestCycleRecords(count: number): Promise<Cycle[]> {
  try {
    const sql = `SELECT * FROM cycles ORDER BY counter DESC LIMIT ${count}`
    const cycleRecords: DbCycle[] = await db.all(sql)

    if (config.verbose) console.log('cycle latest', cycleRecords)
    return cycleRecords as unknown as Cycle[]
  } catch (e) {
    console.log(e)
  }

  return []
}

export async function queryCycleRecordsBetween(start: number, end: number): Promise<Cycle[]> {
  try {
    const sql = `SELECT * FROM cycles WHERE counter BETWEEN ${ph(1)} AND ${ph(2)} ORDER BY counter DESC`
    const cycles: DbCycle[] = await db.all(sql, [start, end])

    if (config.verbose) console.log('cycle between', cycles)
    return cycles as unknown as Cycle[]
  } catch (e) {
    console.log(e)
  }
  return []
}

export async function queryCycleByMarker(marker: string): Promise<Cycle | null> {
  try {
    const sql = `SELECT * FROM cycles WHERE cycleMarker=${ph(1)} LIMIT 1`
    const cycleRecord: DbCycle = await db.get(sql, [marker])

    // Ensure proper parsing of cycleRecord if it exists
    if (cycleRecord && cycleRecord.cycleRecord) {
      if (typeof cycleRecord.cycleRecord === 'string') {
        cycleRecord.cycleRecord = StringUtils.safeJsonParse(cycleRecord.cycleRecord)
      }
    }

    if (config.verbose) console.log('cycle marker', StringUtils.safeStringify(cycleRecord))
    return cycleRecord as unknown as Cycle
  } catch (e) {
    console.log(e)
  }

  return null
}

export async function queryCycleByCounter(counter: number): Promise<Cycle | null> {
  try {
    const sql = `SELECT * FROM cycles WHERE counter=${ph(1)} LIMIT 1`
    const cycleRecord: DbCycle = await db.get(sql, [counter])

    // Ensure proper parsing of cycleRecord if it exists
    if (cycleRecord && cycleRecord.cycleRecord) {
      if (typeof cycleRecord.cycleRecord === 'string') {
        cycleRecord.cycleRecord = StringUtils.safeJsonParse(cycleRecord.cycleRecord)
      }
    }

    if (config.verbose) console.log('cycle counter', cycleRecord)
    return cycleRecord as unknown as Cycle
  } catch (e) {
    console.log(e)
  }

  return null
}

export async function queryCycleCount(): Promise<number> {
  let cycles: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT ${countStar()} FROM cycles`
    cycles = await db.get(sql, [])
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Cycle count', cycles)

  return cycles['COUNT(*)'] || 0
}
