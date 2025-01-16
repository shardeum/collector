import dotenv from 'dotenv'
dotenv.config()
import * as Crypto from '../utils/crypto'
import * as Storage from '../storage'
import * as DataSync from '../class/DataSync'
import { config, overrideDefaultConfig } from '../config'

let startCycle = 0
let endCycle = 0

const cycleNumberToSyncFrom = process.argv[2]
const cycleNumberToSyncTo = process.argv[3]

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
export async function startPatching(): Promise<void> {
  if (cycleNumberToSyncFrom) {
    startCycle = parseInt(cycleNumberToSyncFrom)
  }
  if (cycleNumberToSyncTo) {
    endCycle = parseInt(cycleNumberToSyncTo)
  } else {
    const response = await DataSync.queryFromDistributor(DataSync.DataType.TOTALDATA, {})
    if (response.data && response.data.totalReceipts >= 0 && response.data.totalCycles >= 0) {
      endCycle = response.data.totalCycles
    }
  }
  if (config.verbose) console.log('Start Patching from Cycle', startCycle, 'till the End Cycle', endCycle)

  await DataSync.downloadAndSyncGenesisAccounts() // To sync accounts data that are from genesis accounts/accounts data that the network start with

  await DataSync.downloadCyclcesBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  if (config.verbose) console.log('Cycles Patched!')
  await DataSync.downloadReceiptsBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  if (config.verbose) console.log('Receipts Patched!')
  await DataSync.downloadOriginalTxsDataBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  if (config.verbose) console.log('OriginalTxs Patched!')

  if (config.verbose) console.log('Patching done! from cycle', startCycle, 'to cycle', endCycle)
}

startPatching()
