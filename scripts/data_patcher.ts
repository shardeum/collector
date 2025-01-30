import dotenv from 'dotenv'
dotenv.config()
import * as Crypto from '../src/utils/crypto'
import * as Storage from '../src/storage'
import * as DataSync from '../src/class/DataSync'
import { config, overrideDefaultConfig } from '../src/config'

let startCycle = 0
let endCycle = 0

const cycleNumberToSyncFrom = process.argv[2]
const cycleNumberToSyncTo = process.argv[3]

const patchOnlyMissingData = true

const start = async (): Promise<void> => {
  overrideDefaultConfig(process.env, process.argv)
  // Set crypto hash keys from config
  Crypto.setCryptoHashKey(config.hashKey)
  Storage.initializeDB()
  Storage.addExitListeners()

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
  console.log('Start Cycle', startCycle, 'End Cycle', endCycle)

  await DataSync.downloadAndSyncGenesisAccounts() // To sync accounts data that are from genesis accounts/accounts data that the network start with

  await DataSync.downloadCyclcesBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  console.log('Cycles Patched!')
  await DataSync.downloadReceiptsBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  console.log('Receipts Patched!')
  await DataSync.downloadOriginalTxsDataBetweenCycles(startCycle, endCycle, patchOnlyMissingData)
  console.log('OriginalTxs Patched!')

  await Storage.closeDatabase()
  console.log('Patching done! from cycle', startCycle, 'to cycle', endCycle)
}

start()
