import * as Crypto from '../src/utils/crypto'
import * as Cycle from '../src/storage/cycle'
import * as Transaction from '../src/storage/transaction'
import * as Account from '../src/storage/account'
import * as Receipt from '../src/storage/receipt'
import * as Storage from '../src/storage'
import { config, overrideDefaultConfig } from '../src/config'
import { readFileSync, writeFileSync } from 'fs'

interface MissingData {
  cycles: Array<{ counter: number; majorityHash?: string }>
  receipts: Array<{ id: string; cycle: number; majorityHash?: string }>
  accounts: Array<{ id: string; majorityHash?: string; cycle?: number; cycleNumber?: number }>
  transactions: Array<{ id: string; cycle: number; majorityHash?: string; cycleNumber?: number }>
  timestamp: number
}

const scriptConfig = {
  files: {
    inputFile: 'test.json',
    outputFile: 'missing-collector-data.json',
  },
}

async function main(): Promise<void> {
  overrideDefaultConfig(process.env, process.argv)
  Crypto.setCryptoHashKey(config.hashKey)
  await Storage.initializeDB()

  // read missingDataFile that's a json file
  const missingDataFile = scriptConfig.files.inputFile
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const missingData = JSON.parse(readFileSync(missingDataFile, 'utf8')) as MissingData
  if (!missingData) {
    console.error('No missing data found in the file.')
    return
  }

  const nonPatchedData: MissingData = {
    cycles: [],
    receipts: [],
    accounts: [],
    transactions: [],
    timestamp: Date.now(),
  }
  // check cycles table
  for (const cycle of missingData.cycles) {
    const cycleRecord = await Cycle.queryCycleByCounter(cycle.counter)
    if (!cycleRecord) {
      console.log(`Missing cycle record for cycle ${cycle.counter}`)
      nonPatchedData.cycles.push(cycle)
    } else {
      console.log(`Cycle record for cycle ${cycle.counter} exists`)
    }
  }

  // check receipts table
  for (const receipt of missingData.receipts) {
    const receiptRecord = Receipt.queryReceiptByReceiptId(receipt.id)
    if (!receiptRecord) {
      console.log(`Missing receipt record for receipt ${receipt.id}`)
      nonPatchedData.receipts.push(receipt)
    } else {
      console.log(`Receipt record for receipt ${receipt.id} exists`)
    }
  }
  // check transactions table
  for (const transaction of missingData.transactions) {
    const transactionRecord = await Transaction.queryTransactionByTxId(transaction.id)
    if (!transactionRecord) {
      console.log(`Missing transaction record for transaction ${transaction.id}`)
      nonPatchedData.transactions.push(transaction)
    } else {
      console.log(`Transaction record for transaction ${transaction.id} exists`)
    }
  }
  // check accounts table
  for (const account of missingData.accounts) {
    const accountRecord = Account.queryAccountByAccountId(account.id)
    if (!accountRecord) {
      console.log(`Missing account record for account ${account.id}`)
      nonPatchedData.accounts.push(account)
    } else {
      console.log(`Account record for account ${account.id} exists`)
    }
  }

  // write nonPatchedData to missingDataFile
  const outputFile = scriptConfig.files.outputFile
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(outputFile, JSON.stringify(nonPatchedData, null, 2), 'utf8')
  console.log(`Missing data written to ${outputFile}`)
  // close database
  Storage.closeDatabase()
  console.log('Database closed')
  console.log('Script completed successfully')
  process.exit(0)
}

main()
