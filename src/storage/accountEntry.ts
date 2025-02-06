import { config } from '../config/index'
import { Account, AccountEntry } from '../types'
import * as db from './sqlite3storage'
import { Utils as StringUtils } from '@shardus/types'

export function insertAccountEntry(account: Account): void {
  try {
    const accountEntry: AccountEntry = {
      accountId: account.accountId,
      timestamp: account.timestamp,
      data: account.account,
    }
    const fields = Object.keys(accountEntry).join(', ')
    const placeholders = Object.keys(accountEntry).fill('?').join(', ')
    const values = db.extractValues(accountEntry)
    const sql = 'INSERT OR REPLACE INTO accountsEntry (' + fields + ') VALUES (' + placeholders + ')'
    db.run(sql, values, 'shardeumIndexer')
    if (config.verbose)
      console.log(
        'ShardeumIndexer: Successfully inserted AccountEntry',
        account.ethAddress || account.accountId
      )
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
    const accountEntries: AccountEntry[] = []
    for (const account of accounts) {
      const accountEntry: AccountEntry = {
        accountId: account.accountId,
        timestamp: account.timestamp,
        data: account.account,
      }
      accountEntries.push(accountEntry)
    }
    const fields = Object.keys(accountEntries[0]).join(', ')
    const placeholders = Object.keys(accountEntries[0]).fill('?').join(', ')
    const values = db.extractValuesFromArray(accountEntries)
    let sql = 'INSERT OR REPLACE INTO accountsEntry (' + fields + ') VALUES (' + placeholders + ')'
    for (let i = 1; i < accountEntries.length; i++) {
      sql = sql + ', (' + placeholders + ')'
    }
    db.run(sql, values, 'shardeumIndexer')
    console.log('ShardeumIndexer: Successfully bulk inserted AccountEntries', accountEntries.length)
  } catch (e) {
    console.log(e)
    console.log('ShardeumIndexer: Unable to bulk insert AccountEntries', accounts.length)
  }
}

export function updateAccountEntry(_accountId: string, account: Partial<Account>): void {
  try {
    const sql = `UPDATE accountsEntry SET timestamp = @timestamp, data = @account WHERE accountId = @accountId `
    db.run(
      sql,
      {
        timestamp: account.timestamp,
        account: account.account && StringUtils.safeStringify(account.account),
        accountId: account.accountId,
      },
      'shardeumIndexer'
    )
    if (config.verbose)
      console.log(
        'ShardeumIndexer: Successfully updated AccountEntry',
        account.ethAddress || account.accountId
      )
  } catch (e) {
    console.log(e)
    console.log('ShardeumIndexer: Unable to update AccountEntry', account)
  }
}

export function queryAccountEntryCount(): number {
  let accountEntries: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT COUNT(*) FROM accountsEntry`
    accountEntries = db.get(sql, [], 'shardeumIndexer')
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('AccountEntry count', accountEntries)
  return accountEntries['COUNT(*)'] || 0
}
