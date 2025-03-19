import * as DataSync from '../class/DataSync'
import { config } from '../config'

const patchOnlyMissingData = true

/**
 * Starts the patching process for syncing data.
 *
 * This function initializes the necessary configurations and database connections,
 * sets up the crypto hash keys, and then proceeds to download and sync data between
 * specified cycles. It also handles the patching of missing data if required.
 *
 * The function performs the following steps:
 * 1. Initializes configurations and database if not already initialized.
 * 2. Adds exit listeners to the storage.
 * 3. Determines the start and end cycles for data synchronization.
 * 4. Downloads and syncs genesis accounts data.
 * 5. Downloads and patches cycles data between the specified cycles.
 * 6. Downloads and patches receipts data between the specified cycles.
 * 7. Downloads and patches original transactions data between the specified cycles.
 * 8. Closes the database connection after patching is complete.
 *
 * @returns {Promise<void>} A promise that resolves when the patching process is complete.
 */
export async function startPatching(startCycle: number, endCycle?: number): Promise<boolean> {
  if (startCycle < 0 || endCycle < 0) {
    console.error(`Please provide valid values for start(must be >= 0) and end cycle(if passed then must be >= 0)`)
    return false
  }

  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      if (endCycle === undefined) {
        const response = await DataSync.queryFromDistributor(DataSync.DataType.TOTALDATA, {})

        if (response.data && response.data.totalReceipts >= 0 && response.data.totalCycles >= 0) {
          endCycle = response.data.totalCycles
        }

        if (endCycle === undefined) {
          console.error("The distributor wasn't able to return a valid response object for endCycle", response.data)
          throw new Error('Unable to fetch the end cycle')
        }
      }

      console.log('Start Patching from Cycle', startCycle, 'till the End Cycle', endCycle)

      // await DataSync.downloadAndSyncGenesisAccounts() // To sync accounts data that are from genesis accounts/accounts data that the network start with
      // TO DO : revisit purpose of genesis syncing
      await DataSync.downloadCyclcesBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
      if (config.verbose) console.log('Cycles Patched! from', startCycle, `to`, endCycle)
      await DataSync.downloadReceiptsBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
      if (config.verbose) console.log('Receipts Patched!', startCycle, `to`, endCycle)
      await DataSync.downloadOriginalTxsDataBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
      if (config.verbose) console.log('OriginalTxs Patched!', startCycle, `to`, endCycle)

      console.log('Patching done! from cycle', startCycle, 'to cycle', endCycle)
      return true
    } catch (error) {
      attempt++
      console.error(`Error during patching process (attempt ${attempt}):`, error.message, 'for the cycle', startCycle)
      if (attempt >= maxRetries) {
        console.error('Max retries reached. Patching failed.')
        return false
      }
      console.log(`Retrying patching process (attempt ${attempt + 1})...\n`)
    }
  }

  return false
}
