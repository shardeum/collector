import * as Storage from '../src/storage'
import * as AccountEntryDB from '../src/storage/accountEntry'
import * as AccountDB from '../src/storage/account'
import { AccountSearchType } from '../src/types'

const start = async (): Promise<void> => {
  Storage.initializeDB()
  Storage.addExitListeners()

  const accountsCount = await AccountDB.queryAccountCount(AccountSearchType.All)
  console.log('accountsCount', accountsCount)
  const limit = 100
  for (let i = 0; i < accountsCount; i += limit) {
    const accounts = await AccountDB.queryAccounts(i, limit, AccountSearchType.All)
    console.log('accounts', accounts.length)
    await AccountEntryDB.bulkInsertAccountEntries(accounts)
  }
  const accountEntriesCount = await AccountEntryDB.queryAccountEntryCount()
  console.log('accountEntriesCount', accountEntriesCount)
  await Storage.closeDatabase()
}

start()
