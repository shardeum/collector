import { config } from '../config'
import * as db from './sqlite3storage'

/**
 * Replaces a checkpoint entry in the database with the given value.
 *
 * @param {number} value - The value to be inserted into the checkpoint table.
 * @param {string} [type='cycle'] - The type of the checkpoint (default is 'cycle').
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @throws Will log an error message if the database operation fails.
 */
export async function insertCheckpoint(value: number, type: string = 'cycle'): Promise<void> {
  try {
    const sql = 'REPLACE INTO `checkpoint` (type, value) VALUES (?, ?)'
    db.run(sql, [type, value])
    if (config.verbose) console.log(`Successfully replaced checkpoint ${type} with value ${value}`)
  } catch (e) {
    console.error(`Error in insertCheckpoint with type ${type} and value ${value}:`, e)
  }
}

/**
 * Fetches the latest checkpoint value for a given type from the database.
 *
 * @param {string} [type='cycle'] - The type of the checkpoint (default is 'cycle').
 * @returns {Promise<number>} A promise that resolves to the value if found.
 * @throws Will log an error message and throw an error if the database query fails or if the value is not found.
 */
export async function fetchCheckpoint(type: string = 'cycle'): Promise<number> {
  try {
    const sql = `
      SELECT value
      FROM checkpoint
      WHERE type = ?
      LIMIT 1
    `
    const result: { value: number } = await db.get(sql, [type])
    if (result?.value === undefined) {
      // indicating that a checkpoint has not been inserted yet into the dB
      console.log(`a checkpoint has not been inserted yet into the dB, returning checkpoint as 0`)
      return -1
    }
    return result.value
  } catch (e) {
    console.error(`Error in fetchCheckpoint with type ${type}:`, e)
    throw e
  }
}
