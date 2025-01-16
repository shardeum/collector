import { config } from '../config'
import * as db from './sqlite3storage'

/**
 * Inserts or replaces a checkpoint entry in the database with the given cycle number.
 *
 * @param {number} cycle - The cycle number to be inserted into the checkpoint table.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @throws Will log an error message if the database operation fails.
 */
export async function insertCheckpoint(cycle: number): Promise<void> {
  try {
    const sql = 'INSERT OR REPLACE INTO `checkpoint` (cycle) VALUES (?)'
    await db.run(sql, [cycle])
    if (config.verbose) console.log(`Successfully inserted checkpoint ${cycle}`)
  } catch (e) {
    console.log(`Error in insertCheckpoint with cycle ${cycle}: ${e}`)
  }
}

/**
 * Fetches the latest checkpoint cycle from the database.
 *
 * @returns {Promise<number | null>} A promise that resolves to the cycle number if found, otherwise null.
 * @throws Will log an error message and return null if the database query fails.
 */
export async function fetchCheckpoint(): Promise<number | null> {
  try {
    const sql = `
      SELECT cycle
      FROM checkpoint
      LIMIT 1
    `
    const result: { cycle: number } = await db.get(sql)
    return typeof result?.cycle === 'number' ? result.cycle : null
  } catch (e) {
    console.log(`Error in fetchCheckpoint:`, e)
    return null
  }
}
