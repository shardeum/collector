import { config } from '../config/index'
import { Account, AccountEntry } from '../types'
import * as db from './sqlite3storage'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { upsertSQL, bulkInsertSQL, ph, countStar, batchProcess } from './sqlHelpers'
import { DbName } from './sqlite3storage'

export function insertAccountEntry(account: Account): void {
  try {
    const accountEntry: AccountEntry = {
      accountId: account.accountId,
      timestamp: account.timestamp,
      data: account.account,
    }
    const fields = Object.keys(accountEntry)
    const values = db.extractValues(accountEntry)
    const sql = upsertSQL('accountsEntry', fields, ['accountId'])
    db.run(sql, values, 'shardeumIndexer')
    if (config.verbose)
      console.log('ShardeumIndexer: Successfully inserted AccountEntry', account.ethAddress || account.accountId)
  } catch (e) {
    console.log(e)
    console.log(
      'ShardeumIndexer: Unable to insert AccountEntry or it is already stored in to database',
      account.accountId
    )
  }
}

export function bulkInsertAccountEntries(accounts: Account[]): void {
  try {
    // Empty accounts check
    if (!accounts || accounts.length === 0) {
      return
    }

    const accountEntries: AccountEntry[] = []
    for (const account of accounts) {
      const accountEntry: AccountEntry = {
        accountId: account.accountId,
        timestamp: account.timestamp,
        data: account.account,
      }
      accountEntries.push(accountEntry)
    }

    const fields = Object.keys(accountEntries[0])

    // Use the batchProcess helper
    batchProcess({
      records: accountEntries,
      tableName: 'accountsEntry',
      fields,
      uniqueFields: ['accountId'],
      extractValues: (entry) => db.extractValues(entry),
      extractBatchValues: (batch) => db.extractValuesFromArray(batch),
      dbRunFunction: (sql, values, context) => {
        db.run(sql, values, context as DbName)
        return Promise.resolve()
      },
      dbContext: 'shardeumIndexer',
    })

    if (config.verbose) console.log('ShardeumIndexer: Successfully bulk inserted AccountEntries', accountEntries.length)
  } catch (e) {
    console.log(e)
    console.log('ShardeumIndexer: Unable to bulk insert AccountEntries', accounts.length)
  }
}

export function updateAccountEntry(_accountId: string, account: Partial<Account>): void {
  try {
    const sql = `UPDATE accountsEntry SET timestamp = ${ph(1)}, data = ${ph(2)} WHERE accountId = ${ph(3)}`
    db.run(
      sql,
      [account.timestamp, account.account && StringUtils.safeStringify(account.account), account.accountId],
      'shardeumIndexer'
    )
    if (config.verbose)
      console.log('ShardeumIndexer: Successfully updated AccountEntry', account.ethAddress || account.accountId)
  } catch (e) {
    console.log(e)
    console.log('ShardeumIndexer: Unable to update AccountEntry', account)
  }
}

export function queryAccountEntryCount(): number {
  let accountEntries: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT ${countStar()} FROM accountsEntry`
    accountEntries = db.get(sql, [], 'shardeumIndexer')
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('AccountEntry count', accountEntries)
  return accountEntries['COUNT(*)'] || 0
}
