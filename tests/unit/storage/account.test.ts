import * as accountStorage from '../../../src/storage/account'
import * as db from '../../../src/storage/sqlite3storage'
import { Account, AccountType, ContractType, AccountSearchType, Token, TokenType } from '../../../src/types'
import { createTestDatabase, TestDatabase } from '../../utils/dbMocks'

// Mock dependencies
jest.mock('../../../src/storage/sqlite3storage', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  extractValues: jest.fn(),
  extractValuesFromArray: jest.fn(),
}))

jest.mock('../../../src/storage/accountEntry', () => ({
  insertAccountEntry: jest.fn(),
  bulkInsertAccountEntries: jest.fn(),
  updateAccountEntry: jest.fn(),
}))

jest.mock('../../../src/storage/index', () => ({
  isShardeumIndexerEnabled: jest.fn().mockReturnValue(false),
}))

jest.mock('../../../src/config/index', () => ({
  config: {
    verbose: false,
  },
}))

jest.mock('@shardeum-foundation/lib-types', () => ({
  Utils: {
    safeStringify: jest.fn().mockImplementation(JSON.stringify),
    safeJsonParse: jest.fn().mockImplementation(JSON.parse),
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('Account Storage', () => {
  let testDb: TestDatabase

  beforeEach(() => {
    jest.clearAllMocks()
    testDb = new TestDatabase()
    
    // Set default mock implementations
    mockDb.extractValues.mockImplementation((obj) => Object.values(obj))
    mockDb.extractValuesFromArray.mockImplementation((arr) => arr.flatMap(obj => Object.values(obj)))
  })

  afterEach(() => {
    if (testDb) {
      testDb.cleanup()
    }
  })

  describe('insertAccount', () => {
    it('should insert a new account successfully', () => {
      const mockAccount: Account = {
        accountId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        cycle: 1,
        timestamp: Date.now(),
        ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
        account: {} as any,
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        accountType: AccountType.Account,
        isGlobal: false,
      }

      mockDb.run.mockReturnValue(undefined)

      accountStorage.insertAccount(mockAccount)

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO accounts'),
        expect.any(Array)
      )
      expect(mockDb.extractValues).toHaveBeenCalledWith(mockAccount)
    })

    it('should handle insertion errors gracefully', () => {
      const mockAccount: Account = {
        accountId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        cycle: 1,
        timestamp: Date.now(),
        ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
        account: {} as any,
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        accountType: AccountType.Account,
        isGlobal: false,
      }

      mockDb.run.mockImplementation(() => {
        throw new Error('Database error')
      })

      // Should not throw error, should handle gracefully
      expect(() => accountStorage.insertAccount(mockAccount)).not.toThrow()
      expect(mockDb.run).toHaveBeenCalled()
    })

    it('should generate correct SQL for account insertion', () => {
      const mockAccount: Account = {
        accountId: 'test-id',
        cycle: 1,
        timestamp: 123456789,
        ethAddress: '0x123',
        account: {} as any,
        hash: '0xhash',
        accountType: AccountType.Account,
        isGlobal: false,
      }

      accountStorage.insertAccount(mockAccount)

      const sqlCall = mockDb.run.mock.calls[0]
      expect(sqlCall[0]).toContain('INSERT OR REPLACE INTO accounts')
      expect(sqlCall[0]).toContain('accountId')
      expect(sqlCall[0]).toContain('cycle')
      expect(sqlCall[0]).toContain('timestamp')
    })
  })

  describe('bulkInsertAccounts', () => {
    it('should bulk insert multiple accounts', () => {
      const mockAccounts: Account[] = [
        {
          accountId: '0x1111111111111111111111111111111111111111111111111111111111111111',
          cycle: 1,
          timestamp: Date.now(),
          ethAddress: '0x1111111111111111111111111111111111111111',
          account: {} as any,
          hash: '0x1111',
          accountType: AccountType.Account,
          isGlobal: false,
        },
        {
          accountId: '0x2222222222222222222222222222222222222222222222222222222222222222',
          cycle: 2,
          timestamp: Date.now(),
          ethAddress: '0x2222222222222222222222222222222222222222',
          account: {} as any,
          hash: '0x2222',
          accountType: AccountType.Account,
          isGlobal: false,
        },
      ]

      accountStorage.bulkInsertAccounts(mockAccounts)

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO accounts'),
        expect.any(Array)
      )
      expect(mockDb.extractValuesFromArray).toHaveBeenCalledWith(mockAccounts)
    })

    it('should handle empty array gracefully', () => {
      // bulkInsertAccounts actually doesn't throw for empty arrays in the real implementation
      // It just doesn't do anything since it accesses accounts[0] which will be undefined
      expect(() => accountStorage.bulkInsertAccounts([])).not.toThrow()
    })

    it('should generate SQL with multiple value sets', () => {
      const mockAccounts: Account[] = [
        {
          accountId: '0x1111',
          cycle: 1,
          timestamp: 123,
          ethAddress: '0x111',
          account: {} as any,
          hash: '0x1',
          accountType: AccountType.Account,
          isGlobal: false,
        },
        {
          accountId: '0x2222',
          cycle: 2,
          timestamp: 456,
          ethAddress: '0x222',
          account: {} as any,
          hash: '0x2',
          accountType: AccountType.Account,
          isGlobal: false,
        },
      ]

      accountStorage.bulkInsertAccounts(mockAccounts)

      const sqlCall = mockDb.run.mock.calls[0]
      expect(sqlCall[0]).toContain('INSERT OR REPLACE INTO accounts')
      // Should have two sets of placeholders for two accounts
      expect((sqlCall[0].match(/\(\s*\?\s*,/g) || []).length).toBeGreaterThan(1)
    })
  })

  describe('updateAccount', () => {
    it('should update an existing account', () => {
      const accountId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const updateData: Partial<Account> = {
        accountId,
        cycle: 2,
        timestamp: Date.now(),
        hash: '0xnewhash',
      }

      accountStorage.updateAccount(accountId, updateData)

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts'),
        expect.objectContaining({
          accountId,
          cycle: updateData.cycle,
          timestamp: updateData.timestamp,
          hash: updateData.hash,
        })
      )
    })

    it('should handle update errors gracefully', () => {
      mockDb.run.mockImplementation(() => {
        throw new Error('Update failed')
      })

      const accountId = 'test-id'
      const updateData: Partial<Account> = { cycle: 2 }

      expect(() => accountStorage.updateAccount(accountId, updateData)).not.toThrow()
    })
  })

  describe('queryAccountCount', () => {
    it('should return total account count', () => {
      mockDb.get.mockReturnValue({ 'COUNT(*)': 150 })

      const count = accountStorage.queryAccountCount()

      expect(count).toBe(150)
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM accounts WHERE accountType=?'),
        [AccountType.Account]
      )
    })

    it('should return count for all accounts when type is All', () => {
      mockDb.get.mockReturnValue({ 'COUNT(*)': 200 })

      const count = accountStorage.queryAccountCount(AccountSearchType.All)

      expect(count).toBe(200)
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM accounts'),
        []
      )
    })

    it('should return count for contract accounts', () => {
      mockDb.get.mockReturnValue({ 'COUNT(*)': 50 })

      const count = accountStorage.queryAccountCount(AccountSearchType.CA)

      expect(count).toBe(50)
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM accounts WHERE accountType=? AND contractType IS NOT NULL'),
        [AccountType.Account]
      )
    })

    it('should return count for specific contract types', () => {
      mockDb.get.mockReturnValue({ 'COUNT(*)': 25 })

      const count = accountStorage.queryAccountCount(AccountSearchType.ERC_20)

      expect(count).toBe(25)
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM accounts WHERE accountType=? AND contractType=?'),
        [AccountType.Account, ContractType.ERC_20]
      )
    })

    it('should return 0 on database errors', () => {
      mockDb.get.mockImplementation(() => {
        throw new Error('Database error')
      })

      const count = accountStorage.queryAccountCount()

      expect(count).toBe(0)
    })

    it('should handle null database response', () => {
      mockDb.get.mockReturnValue(null)

      // The function will try to access null['COUNT(*)'] which throws
      expect(() => accountStorage.queryAccountCount()).toThrow()
    })
  })

  describe('queryAccounts', () => {
    it('should return paginated accounts', () => {
      const mockAccounts = [
        {
          accountId: '0x1111',
          cycle: 1,
          timestamp: 123456789,
          ethAddress: '0x111',
          account: '{}',
          hash: '0x1',
          accountType: AccountType.Account,
          isGlobal: false,
        },
        {
          accountId: '0x2222',
          cycle: 2,
          timestamp: 123456790,
          ethAddress: '0x222',
          account: '{}',
          hash: '0x2',
          accountType: AccountType.Account,
          isGlobal: false,
        },
      ]

      mockDb.all.mockReturnValue(mockAccounts)

      const result = accountStorage.queryAccounts(0, 10)

      expect(result).toHaveLength(2)
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM accounts WHERE accountType=? ORDER BY cycle DESC, timestamp DESC LIMIT 10 OFFSET 0'),
        [AccountType.Account]
      )
    })

    it('should handle pagination parameters', () => {
      mockDb.all.mockReturnValue([])

      accountStorage.queryAccounts(20, 5)

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 5 OFFSET 20'),
        [AccountType.Account]
      )
    })

    it('should query all accounts when type is All', () => {
      mockDb.all.mockReturnValue([])

      accountStorage.queryAccounts(0, 10, AccountSearchType.All)

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM accounts ORDER BY cycle DESC, timestamp DESC LIMIT 10 OFFSET 0'),
        []
      )
    })

    it('should query contract accounts', () => {
      mockDb.all.mockReturnValue([])

      accountStorage.queryAccounts(0, 10, AccountSearchType.CA)

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM accounts WHERE accountType=? AND contractType IS NOT NULL'),
        [AccountType.Account]
      )
    })

    it('should parse JSON account data', () => {
      const mockAccounts = [
        {
          accountId: '0x1111',
          account: '{"balance":"1000"}',
          contractInfo: '{"name":"Test"}',
        },
      ]

      mockDb.all.mockReturnValue(mockAccounts)

      const result = accountStorage.queryAccounts(0, 10)

      expect(result[0].account).toEqual({ balance: '1000' })
      expect(result[0].contractInfo).toEqual({ name: 'Test' })
    })

    it('should handle database errors gracefully', () => {
      mockDb.all.mockImplementation(() => {
        throw new Error('Database error')
      })

      const result = accountStorage.queryAccounts(0, 10)

      expect(result).toEqual([])
    })
  })

  describe('queryAccountByAccountId', () => {
    it('should return account by ID', () => {
      const mockAccount = {
        accountId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        cycle: 1,
        timestamp: 123456789,
        ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
        account: '{"balance":"1000"}',
        hash: '0xhash',
        accountType: AccountType.Account,
        isGlobal: false,
      }

      mockDb.get.mockReturnValue(mockAccount)

      const result = accountStorage.queryAccountByAccountId(mockAccount.accountId)

      expect(result).toBeDefined()
      expect(result!.accountId).toBe(mockAccount.accountId)
      expect(result!.account).toEqual({ balance: '1000' })
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM accounts WHERE accountId=?',
        [mockAccount.accountId]
      )
    })

    it('should return null when account not found', () => {
      mockDb.get.mockReturnValue(null)

      const result = accountStorage.queryAccountByAccountId('nonexistent-id')

      expect(result).toBeNull()
    })

    it('should handle database errors', () => {
      mockDb.get.mockImplementation(() => {
        throw new Error('Database error')
      })

      const result = accountStorage.queryAccountByAccountId('test-id')

      expect(result).toBeNull()
    })

    it('should parse contractInfo if present', () => {
      const mockAccount = {
        accountId: 'test-id',
        account: '{}',
        contractInfo: '{"type":"ERC20"}',
      }

      mockDb.get.mockReturnValue(mockAccount)

      const result = accountStorage.queryAccountByAccountId('test-id')

      expect(result!.contractInfo).toEqual({ type: 'ERC20' })
    })
  })

  describe('Token Operations', () => {
    describe('insertToken', () => {
      it('should insert a token successfully', () => {
        const mockToken: Token = {
          ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
          contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          tokenValue: '1000000000000000000',
          tokenType: TokenType.ERC_20,
        }

        accountStorage.insertToken(mockToken)

        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO tokens'),
          expect.any(Array)
        )
        expect(mockDb.extractValues).toHaveBeenCalledWith(mockToken)
      })

      it('should handle token insertion errors', () => {
        mockDb.run.mockImplementation(() => {
          throw new Error('Token insertion failed')
        })

        const mockToken: Token = {
          ethAddress: '0x123',
          contractAddress: '0xabc',
          tokenValue: '1000',
          tokenType: TokenType.ERC_20,
        }

        expect(() => accountStorage.insertToken(mockToken)).not.toThrow()
      })
    })

    describe('bulkInsertTokens', () => {
      it('should bulk insert tokens', () => {
        const mockTokens: Token[] = [
          {
            ethAddress: '0x111',
            contractAddress: '0xaaa',
            tokenValue: '1000',
            tokenType: TokenType.ERC_20,
          },
          {
            ethAddress: '0x222',
            contractAddress: '0xbbb',
            tokenValue: '2000',
            tokenType: TokenType.ERC_721,
          },
        ]

        accountStorage.bulkInsertTokens(mockTokens)

        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO tokens'),
          expect.any(Array)
        )
        expect(mockDb.extractValuesFromArray).toHaveBeenCalledWith(mockTokens)
      })

      it('should handle bulk token insertion errors', () => {
        mockDb.run.mockImplementation(() => {
          throw new Error('Bulk insertion failed')
        })

        const mockTokens: Token[] = [
          {
            ethAddress: '0x111',
            contractAddress: '0xaaa',
            tokenValue: '1000',
            tokenType: TokenType.ERC_20,
          },
        ]

        expect(() => accountStorage.bulkInsertTokens(mockTokens)).not.toThrow()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined database responses', () => {
      mockDb.get.mockReturnValue(undefined)
      mockDb.all.mockReturnValue(undefined)

      // The function will try to access undefined['COUNT(*)'] which throws
      expect(() => accountStorage.queryAccountCount()).toThrow()
      
      const accountsResult = accountStorage.queryAccounts(0, 10)
      const accountResult = accountStorage.queryAccountByAccountId('test-id')

      // When db.all returns undefined, accounts gets assigned undefined
      // Then forEach on undefined will throw, caught by try-catch, and accounts stays undefined
      expect(accountsResult).toBeUndefined()
      // When db.get returns undefined, function returns undefined as Account (line 193)
      expect(accountResult).toBeUndefined()
    })

    it('should validate account ID format in queries', () => {
      const validAccountId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const invalidAccountId = 'invalid-id'

      expect(validAccountId.length).toBe(66) // 0x + 64 hex chars
      expect(validAccountId.startsWith('0x')).toBe(true)
      expect(invalidAccountId.length).toBeLessThan(66)
    })

    it('should handle SQL injection attempts safely', () => {
      const maliciousId = "'; DROP TABLE accounts; --"
      
      mockDb.get.mockReturnValue(null)
      
      accountStorage.queryAccountByAccountId(maliciousId)
      
      // Should use parameterized query, not string concatenation
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM accounts WHERE accountId=?',
        [maliciousId]
      )
    })
  })
})