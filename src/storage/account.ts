import * as db from './sqlite3storage'
import { extractValues, extractValuesFromArray } from './sqlite3storage'
import { config } from '../config/index'
import { AccountType, AccountSearchType, WrappedEVMAccount, Account, Token, ContractType, AccountCopy } from '../types'
import { bytesToHex } from '@ethereumjs/util'
import { getContractInfo } from '../class/TxDecoder'
import { isShardeumIndexerEnabled } from '.'
import { bulkInsertAccountEntries, insertAccountEntry, updateAccountEntry } from './accountEntry'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { upsertSQL, bulkInsertSQL, ph, cmp, whereOrAnd, rowPlaceholders } from './sqlHelpers'

type DbAccount = Account & {
  account: string
  contractInfo: string
}

export const EOA_CodeHash = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

export function insertAccount(account: Account): void {
  try {
    const fields = Object.keys(account)
    const values = extractValues(account)
    const sql = upsertSQL('accounts', fields, ['accountId'])
    db.run(sql, values)
    if (config.verbose) console.log('Successfully inserted Account', account.ethAddress || account.accountId)
    if (isShardeumIndexerEnabled()) insertAccountEntry(account)
  } catch (e) {
    console.log(e)
    console.log('Unable to insert Account or it is already stored in to database', account.accountId)
  }
}

export function bulkInsertAccounts(accounts: Account[]): void {
  try {
    const fields = Object.keys(accounts[0])
    const { sql, getParamIndex } = bulkInsertSQL('accounts', fields, accounts.length, ['accountId'])
    const values = extractValuesFromArray(accounts)
    db.run(sql, values)
    if (config.verbose) console.log('Successfully bulk inserted Accounts', accounts.length)
    if (isShardeumIndexerEnabled()) bulkInsertAccountEntries(accounts)
  } catch (e) {
    console.log(e)
    console.log('Unable to bulk insert Accounts', accounts.length)
  }
}

export function updateAccount(_accountId: string, account: Partial<Account>): void {
  try {
    const sql = `
      UPDATE accounts 
      SET cycle = ${ph(1)}, 
          timestamp = ${ph(2)}, 
          account = ${ph(3)}, 
          hash = ${ph(4)} 
      WHERE accountId = ${ph(5)}`
    db.run(sql, [
      account.cycle,
      account.timestamp,
      account.account && StringUtils.safeStringify(account.account),
      account.hash,
      account.accountId,
    ])
    if (config.verbose) console.log('Successfully updated Account', account.ethAddress || account.accountId)
    if (isShardeumIndexerEnabled()) updateAccountEntry(_accountId, account)
  } catch (e) {
    console.log(e)
    console.log('Unable to update Account', account)
  }
}

export function insertToken(token: Token): void {
  try {
    const fields = Object.keys(token)
    const values = extractValues(token)
    const sql = upsertSQL('tokens', fields, ['ethAddress'])
    db.run(sql, values)
    if (config.verbose) console.log('Successfully inserted Token', token.ethAddress)
  } catch (e) {
    console.log(e)
    console.log('Unable to insert Token or it is already stored in to database', token.ethAddress)
  }
}

export function bulkInsertTokens(tokens: Token[]): void {
  try {
    const fields = Object.keys(tokens[0])
    const { sql, getParamIndex } = bulkInsertSQL('tokens', fields, tokens.length, ['ethAddress'])
    const values = extractValuesFromArray(tokens)
    db.run(sql, values)
    console.log('Successfully inserted Tokens', tokens.length)
  } catch (e) {
    console.log(e)
    console.log('Unable to bulk insert Tokens', tokens.length)
  }
}

export function queryAccountCount(type?: ContractType | AccountSearchType): number {
  let accounts: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    if (type || type === AccountSearchType.All) {
      if (type === AccountSearchType.All) {
        const sql = `SELECT COUNT(*) FROM accounts`
        accounts = db.get(sql, [])
      } else if (type === AccountSearchType.CA) {
        const sql = `SELECT COUNT(*) FROM accounts WHERE accountType=${ph(1)} AND contractType IS NOT NULL`
        accounts = db.get(sql, [AccountType.Account])
      } else if (
        type === AccountSearchType.GENERIC ||
        type === AccountSearchType.ERC_20 ||
        type === AccountSearchType.ERC_721 ||
        type === AccountSearchType.ERC_1155
      ) {
        type =
          type === AccountSearchType.GENERIC
            ? ContractType.GENERIC
            : type === AccountSearchType.ERC_20
            ? ContractType.ERC_20
            : type === AccountSearchType.ERC_721
            ? ContractType.ERC_721
            : ContractType.ERC_1155
        const sql = `SELECT COUNT(*) FROM accounts WHERE accountType=${ph(1)} AND contractType=${ph(2)}`
        accounts = db.get(sql, [AccountType.Account, type])
      }
    } else {
      const sql = `SELECT COUNT(*) FROM accounts WHERE accountType=${ph(1)}`
      accounts = db.get(sql, [AccountType.Account])
    }
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Account count', accounts)
  return accounts['COUNT(*)'] || 0
}

export function queryAccounts(skip = 0, limit = 10, type?: AccountSearchType | ContractType): Account[] {
  let accounts: DbAccount[] = []
  try {
    if (type || type === AccountSearchType.All) {
      if (type === AccountSearchType.All) {
        const sql = `SELECT * FROM accounts ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(1)} OFFSET ${ph(2)}`
        accounts = db.all(sql, [limit, skip])
      } else if (type === AccountSearchType.CA) {
        const sql = `SELECT * FROM accounts WHERE accountType=${ph(
          1
        )} AND contractType IS NOT NULL ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(2)} OFFSET ${ph(3)}`
        accounts = db.all(sql, [AccountType.Account, limit, skip])
      } else if (
        type === AccountSearchType.GENERIC ||
        type === AccountSearchType.ERC_20 ||
        type === AccountSearchType.ERC_721 ||
        type === AccountSearchType.ERC_1155
      ) {
        type =
          type === AccountSearchType.GENERIC
            ? ContractType.GENERIC
            : type === AccountSearchType.ERC_20
            ? ContractType.ERC_20
            : type === AccountSearchType.ERC_721
            ? ContractType.ERC_721
            : ContractType.ERC_1155
        const sql = `SELECT * FROM accounts WHERE accountType=${ph(1)} AND contractType=${ph(
          2
        )} ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(3)} OFFSET ${ph(4)}`
        accounts = db.all(sql, [AccountType.Account, type, limit, skip])
      }
    } else {
      const sql = `SELECT * FROM accounts WHERE accountType=${ph(1)} ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(
        2
      )} OFFSET ${ph(3)}`
      accounts = db.all(sql, [AccountType.Account, limit, skip])
    }
    accounts.forEach((account: DbAccount) => {
      if (account.account) account.account = StringUtils.safeJsonParse(account.account)
      if (account.contractInfo) account.contractInfo = StringUtils.safeJsonParse(account.contractInfo)
    })
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Accounts accounts', accounts)
  return accounts
}

export function queryAccountByAccountId(accountId: string): Account | null {
  try {
    const sql = `SELECT * FROM accounts WHERE accountId=${ph(1)}`
    const account: DbAccount = db.get(sql, [accountId])
    if (account) account.account = StringUtils.safeJsonParse(account.account)
    if (account && account.contractInfo) account.contractInfo = StringUtils.safeJsonParse(account.contractInfo)
    if (config.verbose) console.log('Account accountId', account)
    return account as Account
  } catch (e) {
    console.log(e)
  }
  return null
}

export function queryAccountByAddress(address: string, accountType = AccountType.Account): Account | null {
  try {
    const sql = `SELECT * FROM accounts WHERE accountType=${ph(1)} AND ethAddress=${ph(
      2
    )} ORDER BY accountType ASC LIMIT 1`
    const account: DbAccount = db.get(sql, [accountType, address])
    if (account) account.account = StringUtils.safeJsonParse(account.account)
    if (account && account.contractInfo) account.contractInfo = StringUtils.safeJsonParse(account.contractInfo)
    if (config.verbose) console.log('Account Address', account)
    return account as Account
  } catch (e) {
    console.log(e)
  }
  return null
}

export function queryAccountCountBetweenCycles(startCycleNumber: number, endCycleNumber: number): number {
  let accounts: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT COUNT(*) FROM accounts WHERE cycle BETWEEN ${ph(1)} AND ${ph(2)}`
    accounts = db.get(sql, [startCycleNumber, endCycleNumber])
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) {
    console.log('Account count between cycle', accounts)
  }
  return accounts['COUNT(*)'] || 0
}

export function queryAccountsBetweenCycles(
  skip = 0,
  limit = 10000,
  startCycleNumber: number,
  endCycleNumber: number
): Account[] {
  let accounts: DbAccount[] = []
  try {
    const sql = `SELECT * FROM accounts WHERE cycle BETWEEN ${ph(1)} AND ${ph(
      2
    )} ORDER BY cycle DESC, timestamp DESC LIMIT ${ph(3)} OFFSET ${ph(4)}`
    accounts = db.all(sql, [startCycleNumber, endCycleNumber, limit, skip])
    accounts.forEach((account: DbAccount) => {
      if (account.account)
        (account as Account).account = StringUtils.safeJsonParse(account.account) as WrappedEVMAccount
      if (account.contractInfo) (account as Account).contractInfo = StringUtils.safeJsonParse(account.contractInfo)
    })
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) {
    console.log('Account accounts', accounts ? accounts.length : accounts, 'skip', skip)
  }
  return accounts
}

export function queryTokensByAddress(address: string, detail = false): object[] {
  try {
    const sql = `SELECT * FROM tokens WHERE ethAddress=${ph(1)}`
    const tokens = db.all(sql, [address]) as Token[]
    const filterTokens: object[] = []
    if (detail) {
      for (const { contractAddress, tokenValue } of tokens) {
        const accountExist = queryAccountByAccountId(
          contractAddress.slice(2).toLowerCase() + '0'.repeat(24) //Search by Shardus address
        )
        if (accountExist && accountExist.contractType) {
          filterTokens.push({
            contractAddress: contractAddress,
            contractInfo: accountExist.contractInfo,
            contractType: accountExist.contractType,
            balance: tokenValue,
          })
        }
      }
    }
    if (config.verbose) console.log('Tokens of an address', tokens)
    return filterTokens
  } catch (e) {
    console.log(e)
  }
  return []
}

export function queryTokenBalance(
  contractAddress: string,
  addressToSearch: string
): { success: boolean; error?: string; balance?: string } {
  const sql = `SELECT * FROM tokens WHERE ethAddress=${ph(1)} AND contractAddress=${ph(2)}`
  const token: Token = db.get(sql, [addressToSearch, contractAddress])
  if (config.verbose) console.log('Token balance', token)
  if (!token) return { success: false, error: 'tokenBalance is not found' }
  return {
    success: true,
    balance: token?.tokenValue,
  }
}

export function queryTokenHolderCount(contractAddress: string): number {
  let tokens: { 'COUNT(*)': number } = { 'COUNT(*)': 0 }
  try {
    const sql = `SELECT COUNT(*) FROM tokens WHERE contractAddress=${ph(1)}`
    tokens = db.get(sql, [contractAddress])
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Token holder count', tokens)

  return tokens['COUNT(*)'] || 0
}

export function queryTokenHolders(skip = 0, limit = 10, contractAddress: string): Token[] {
  let tokens: Token[] = []
  try {
    const sql = `SELECT * FROM tokens WHERE contractAddress=${ph(1)} ORDER BY tokenValue DESC LIMIT ${ph(
      2
    )} OFFSET ${ph(3)}`
    tokens = db.all(sql, [contractAddress, limit, skip])
  } catch (e) {
    console.log(e)
  }
  if (config.verbose) console.log('Token holders', tokens)
  return tokens
}

export async function processAccountData(accounts: AccountCopy[]): Promise<Account[]> {
  console.log('accounts size', accounts.length)
  if (accounts && accounts.length <= 0) return []
  const bucketSize = 1000
  let combineAccounts: Account[] = []

  const transactions: Account[] = []

  for (const account of accounts) {
    try {
      if (typeof account.data === 'string') account.data = StringUtils.safeJsonParse(account.data)
    } catch (e) {
      console.log('Error in parsing account data', account.data)
      continue
    }
    const accountType = account.data.accountType
    const accObj: Account = {
      accountId: account.accountId,
      ethAddress: account.accountId,
      cycle: account.cycleNumber,
      timestamp: account.timestamp,
      account: account.data,
      hash: account.hash,
      accountType,
      isGlobal: account.isGlobal,
    } as Account
    if (
      accountType === AccountType.Account ||
      accountType === AccountType.ContractStorage ||
      accountType === AccountType.ContractCode
    ) {
      accObj.ethAddress = account.data.ethAddress.toLowerCase()
      if (
        config.processData.decodeContractInfo &&
        accountType === AccountType.Account &&
        'account' in accObj.account &&
        bytesToHex(Uint8Array.from(Object.values(accObj.account.account.codeHash))) !== EOA_CodeHash
      ) {
        const { contractInfo, contractType } = await getContractInfo(accObj.ethAddress)
        accObj.contractInfo = contractInfo
        accObj.contractType = contractType
        insertAccount(accObj)
        insertAccountEntry(accObj)
        continue
      }
    } else if (
      accountType === AccountType.NetworkAccount ||
      accountType === AccountType.DevAccount ||
      accountType === AccountType.NodeAccount ||
      accountType === AccountType.NodeAccount2 ||
      accountType === AccountType.SecureAccount
    ) {
      accObj.ethAddress = account.accountId // Adding accountId as ethAddess for these account types for now; since we need ethAddress for mysql index
    }
    combineAccounts.push(accObj)
    if (
      accountType === AccountType.Receipt ||
      accountType === AccountType.NodeRewardReceipt ||
      accountType === AccountType.StakeReceipt ||
      accountType === AccountType.UnstakeReceipt
    ) {
      transactions.push(account as unknown as Account)
    }
    if (combineAccounts.length >= bucketSize) {
      bulkInsertAccounts(combineAccounts)
      combineAccounts = []
    }
  }
  if (combineAccounts.length > 0) bulkInsertAccounts(combineAccounts)
  return transactions
}
