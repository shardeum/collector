import { TransactionFactory } from '@ethereumjs/tx'
import { bytesToHex, toAscii, toBytes } from '@ethereumjs/util'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import {
  getTransactionObj,
  isStakingEVMTx,
  getStakeTxBlobFromEVMTx,
  decodeEVMRawTxData,
} from '../../../src/utils/decodeEVMRawTx'
import { config } from '../../../src/config'
import { TransactionType as TransactionType2 } from '../../../src/types'

// Mock dependencies
jest.mock('@ethereumjs/tx')
jest.mock('@ethereumjs/util')
jest.mock('@shardeum-foundation/lib-types')
jest.mock('../../../src/config', () => ({
  config: {
    verbose: false,
  },
}))

describe('Utils - decodeEVMRawTx.ts', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    config.verbose = false
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('getTransactionObj', () => {
    it('should parse legacy transaction successfully', () => {
      const mockTx = { raw: '0x1234567890', timestamp: Date.now() }
      const mockTransactionObj = { type: 'legacy', data: 'test' }
      const mockSerializedData = new Uint8Array([1, 2, 3, 4])

      ;(toBytes as jest.Mock).mockReturnValue(mockSerializedData)
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTransactionObj)

      const result = getTransactionObj(mockTx)

      expect(toBytes).toHaveBeenCalledWith('0x1234567890')
      expect(TransactionFactory.fromSerializedData).toHaveBeenCalledWith(mockSerializedData)
      expect(result).toBe(mockTransactionObj)
    })

    it('should fallback to AccessListEIP2930 when legacy fails', () => {
      const mockTx = { raw: '0xabcdef', timestamp: Date.now() }
      const mockAccessListTx = { type: 'accessList', data: 'test' }
      const mockSerializedData = new Uint8Array([5, 6, 7])

      ;(toBytes as jest.Mock).mockReturnValue(mockSerializedData)
      ;(TransactionFactory.fromSerializedData as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Legacy tx parse failed')
        })
        .mockReturnValueOnce(mockAccessListTx)

      const result = getTransactionObj(mockTx)

      expect(TransactionFactory.fromSerializedData).toHaveBeenCalledTimes(2)
      expect(result).toBe(mockAccessListTx)
    })

    it('should throw error when tx has no raw field', () => {
      const mockTx = {} as any

      expect(() => getTransactionObj(mockTx)).toThrow('tx has no raw field')
    })

    it('should throw error when both transaction types fail', () => {
      const mockTx = { raw: '0x123', timestamp: Date.now() }

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]))
      ;(TransactionFactory.fromSerializedData as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Legacy failed')
        })
        .mockImplementationOnce(() => {
          throw new Error('AccessList failed')
        })

      expect(() => getTransactionObj(mockTx)).toThrow('tx obj fail')
    })

    it('should log errors when verbose is true', () => {
      config.verbose = true
      const mockTx = { raw: '0x123', timestamp: Date.now() }

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]))
      ;(TransactionFactory.fromSerializedData as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Legacy parse error')
        })
        .mockImplementationOnce(() => {
          throw new Error('AccessList parse error')
        })

      expect(() => getTransactionObj(mockTx)).toThrow('tx obj fail')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to get legacy transaction obj',
        expect.any(Error)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to get transaction obj',
        expect.any(Error)
      )
    })
  })

  describe('isStakingEVMTx', () => {
    const stakeTargetAddress = '0x0000000000000000000000000000000000000001'

    it('should return true for staking transactions', () => {
      const mockTransaction = {
        to: {
          toString: () => stakeTargetAddress,
        },
      } as any

      expect(isStakingEVMTx(mockTransaction)).toBe(true)
    })

    it('should return false for non-staking transactions', () => {
      const mockTransaction = {
        to: {
          toString: () => '0x742d35Cc6634C0532925a3b844Bc9e7595f8fA28',
        },
      } as any

      expect(isStakingEVMTx(mockTransaction)).toBe(false)
    })

    it('should return false when to address is null', () => {
      const mockTransaction = {
        to: null,
      } as any

      expect(isStakingEVMTx(mockTransaction)).toBe(false)
    })

    it('should return false when to address is undefined', () => {
      const mockTransaction = {} as any

      expect(isStakingEVMTx(mockTransaction)).toBe(false)
    })

    it('should handle different address formats', () => {
      const testCases = [
        { to: { toString: () => '0x0000000000000000000000000000000000000001' }, expected: true },
        { to: { toString: () => '0x0000000000000000000000000000000000000002' }, expected: false },
        { to: { toString: () => stakeTargetAddress.toLowerCase() }, expected: true },
        { to: { toString: () => stakeTargetAddress.toUpperCase() }, expected: false }, // Case sensitive
      ]

      testCases.forEach(({ to, expected }) => {
        const mockTransaction = { to } as any
        expect(isStakingEVMTx(mockTransaction)).toBe(expected)
      })
    })
  })

  describe('getStakeTxBlobFromEVMTx', () => {
    it('should successfully parse stake transaction data', () => {
      const mockStakeData = { stake: 1000, validator: '0x123' }
      const mockTransaction = {
        data: new Uint8Array([1, 2, 3, 4]),
      } as any

      ;(bytesToHex as jest.Mock).mockReturnValue('0x1234')
      ;(toAscii as jest.Mock).mockReturnValue(JSON.stringify(mockStakeData))
      ;(StringUtils.safeJsonParse as jest.Mock).mockReturnValue(mockStakeData)

      const result = getStakeTxBlobFromEVMTx(mockTransaction)

      expect(bytesToHex).toHaveBeenCalledWith(mockTransaction.data)
      expect(toAscii).toHaveBeenCalledWith('0x1234')
      expect(StringUtils.safeJsonParse).toHaveBeenCalledWith(JSON.stringify(mockStakeData))
      expect(result).toEqual(mockStakeData)
    })

    it('should handle parse errors gracefully', () => {
      const mockTransaction = {
        data: new Uint8Array([5, 6, 7]),
      } as any

      ;(bytesToHex as jest.Mock).mockImplementation(() => {
        throw new Error('Hex conversion failed')
      })

      const result = getStakeTxBlobFromEVMTx(mockTransaction)

      expect(result).toBeUndefined()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to get stakeTxBlobFromEVMTx',
        expect.any(Error)
      )
    })

    it('should handle invalid JSON data', () => {
      const mockTransaction = {
        data: new Uint8Array([1, 2, 3]),
      } as any

      ;(bytesToHex as jest.Mock).mockReturnValue('0x123')
      ;(toAscii as jest.Mock).mockReturnValue('invalid json')
      ;(StringUtils.safeJsonParse as jest.Mock).mockImplementation(() => {
        throw new Error('JSON parse error')
      })

      const result = getStakeTxBlobFromEVMTx(mockTransaction)

      expect(result).toBeUndefined()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to get stakeTxBlobFromEVMTx',
        expect.any(Error)
      )
    })
  })

  describe('decodeEVMRawTxData', () => {
    it('should decode EVM transaction data successfully', () => {
      const mockTxObj = {
        getSenderAddress: () => ({ toString: () => '0xSenderAddress' }),
        to: { toString: () => '0xRecipientAddress' },
        nonce: { toString: (base: number) => base === 16 ? 'a5' : '165' },
        value: { toString: (base: number) => base === 16 ? '1f4' : '500' },
        data: Buffer.from('testdata'),
      }

      const originalTxData = {
        originalTxData: {
          tx: { raw: '0x1234567890' },
        },
        transactionType: TransactionType2.Receipt,
      } as any

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]))
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTxObj)

      decodeEVMRawTxData(originalTxData)

      expect(originalTxData.originalTxData.readableReceipt).toEqual({
        from: '0xSenderAddress',
        to: '0xRecipientAddress',
        nonce: 'a5',
        value: '1f4',
        data: '0xtestdata',
      })
    })

    it('should handle contract creation (null to address)', () => {
      const mockTxObj = {
        getSenderAddress: () => ({ toString: () => '0xSender' }),
        to: null,
        nonce: { toString: (base: number) => base === 16 ? '1' : '1' },
        value: { toString: (base: number) => base === 16 ? '0' : '0' },
        data: Buffer.from('contractcode'),
      }

      const originalTxData = {
        originalTxData: {
          tx: { raw: '0xabc' },
        },
        transactionType: TransactionType2.Receipt,
      } as any

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1]))
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTxObj)

      decodeEVMRawTxData(originalTxData)

      expect(originalTxData.originalTxData.readableReceipt.to).toBeNull()
    })

    it('should decode stake transaction with internal data', () => {
      const mockStakeData = { amount: 1000, validator: '0xValidator' }
      const mockTxObj = {
        getSenderAddress: () => ({ toString: () => '0xStaker' }),
        to: { toString: () => '0x0000000000000000000000000000000000000001' },
        nonce: { toString: (base: number) => '1' },
        value: { toString: (base: number) => '0' },
        data: Buffer.from('stakedata'),
      }

      const originalTxData = {
        originalTxData: {
          tx: { raw: '0xstake' },
        },
        transactionType: TransactionType2.StakeReceipt,
      } as any

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1]))
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTxObj)
      ;(bytesToHex as jest.Mock).mockReturnValue('0xhex')
      ;(toAscii as jest.Mock).mockReturnValue(JSON.stringify(mockStakeData))
      ;(StringUtils.safeJsonParse as jest.Mock).mockReturnValue(mockStakeData)

      decodeEVMRawTxData(originalTxData)

      expect(originalTxData.originalTxData.readableReceipt.internalTxData).toEqual(mockStakeData)
    })

    it('should decode unstake transaction with internal data', () => {
      const mockUnstakeData = { amount: 500 }
      const mockTxObj = {
        getSenderAddress: () => ({ toString: () => '0xUnstaker' }),
        to: { toString: () => '0x0000000000000000000000000000000000000001' },
        nonce: { toString: (base: number) => '2' },
        value: { toString: (base: number) => '0' },
        data: Buffer.from('unstakedata'),
      }

      const originalTxData = {
        originalTxData: {
          tx: { raw: '0xunstake' },
        },
        transactionType: TransactionType2.UnstakeReceipt,
      } as any

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([2]))
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTxObj)
      ;(bytesToHex as jest.Mock).mockReturnValue('0xhex2')
      ;(toAscii as jest.Mock).mockReturnValue(JSON.stringify(mockUnstakeData))
      ;(StringUtils.safeJsonParse as jest.Mock).mockReturnValue(mockUnstakeData)

      decodeEVMRawTxData(originalTxData)

      expect(originalTxData.originalTxData.readableReceipt.internalTxData).toEqual(mockUnstakeData)
    })

    it('should do nothing when tx has no raw field', () => {
      const originalTxData = {
        originalTxData: {
          tx: {},
        },
      } as any

      const originalData = { ...originalTxData }

      decodeEVMRawTxData(originalTxData)

      // Should remain unchanged
      expect(originalTxData).toEqual(originalData)
    })

    it('should preserve original data when adding readableReceipt', () => {
      const mockTxObj = {
        getSenderAddress: () => ({ toString: () => '0xSender' }),
        to: { toString: () => '0xRecipient' },
        nonce: { toString: () => '1' },
        value: { toString: () => '100' },
        data: Buffer.from('data'),
      }

      const originalTxData = {
        originalTxData: {
          tx: { raw: '0x123', originalField: 'preserved' },
          anotherField: 'alsoPreserved',
        },
        transactionType: TransactionType2.Receipt,
      } as any

      ;(toBytes as jest.Mock).mockReturnValue(new Uint8Array([1]))
      ;(TransactionFactory.fromSerializedData as jest.Mock).mockReturnValue(mockTxObj)

      decodeEVMRawTxData(originalTxData)

      expect(originalTxData.originalTxData.tx.originalField).toBe('preserved')
      expect(originalTxData.originalTxData.anotherField).toBe('alsoPreserved')
      expect(originalTxData.originalTxData.readableReceipt).toBeDefined()
    })
  })
})