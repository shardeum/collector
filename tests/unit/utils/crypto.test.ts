import * as core from '@shardeum-foundation/lib-crypto-utils'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'
import { setCryptoHashKey, hashObj, sign, verify } from '../../../src/utils/crypto'
import { config as COLLECTOR_CONFIG } from '../../../src/config'

// Mock the external dependencies
jest.mock('@shardeum-foundation/lib-crypto-utils')
jest.mock('@shardeum-foundation/lib-types')
jest.mock('../../../src/config', () => ({
  config: {
    collectorInfo: {
      secretKey: 'mock-secret-key',
      publicKey: 'mock-public-key',
    },
  },
}))

describe('Utils - crypto.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setCryptoHashKey', () => {
    it('should initialize crypto with hashkey and set custom stringifier', () => {
      const mockHashKey = 'test-hash-key-123'
      const mockInit = jest.fn()
      const mockSetCustomStringifier = jest.fn()

      ;(core as jest.Mocked<typeof core>).init = mockInit
      ;(core as jest.Mocked<typeof core>).setCustomStringifier = mockSetCustomStringifier
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = jest.fn()

      setCryptoHashKey(mockHashKey)

      expect(mockInit).toHaveBeenCalledWith(mockHashKey)
      expect(mockInit).toHaveBeenCalledTimes(1)

      expect(mockSetCustomStringifier).toHaveBeenCalledWith(StringUtils.safeStringify, 'shardus_safeStringify')
      expect(mockSetCustomStringifier).toHaveBeenCalledTimes(1)
    })

    it('should handle empty hashkey', () => {
      const mockInit = jest.fn()
      ;(core as jest.Mocked<typeof core>).init = mockInit

      setCryptoHashKey('')

      expect(mockInit).toHaveBeenCalledWith('')
    })

    it('should handle special characters in hashkey', () => {
      const mockInit = jest.fn()
      ;(core as jest.Mocked<typeof core>).init = mockInit

      const specialHashKey = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      setCryptoHashKey(specialHashKey)

      expect(mockInit).toHaveBeenCalledWith(specialHashKey)
    })
  })

  describe('hashObj', () => {
    it('should export hashObj from core library', () => {
      // hashObj is directly exported from core, so we just verify it exists
      const { hashObj: importedHashObj } = require('../../../src/utils/crypto')

      // Verify it's a function
      expect(typeof importedHashObj).toBe('function')

      // Verify it's the same as core.hashObj
      expect(importedHashObj).toBe(core.hashObj)
    })
  })

  describe('sign', () => {
    it('should sign an object with collector keys', () => {
      const mockSignObj = jest.fn()
      const mockSafeStringify = jest.fn().mockReturnValue('{"test":"value"}')
      const mockSafeJsonParse = jest.fn().mockReturnValue({ test: 'value' })

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      const testObj = { test: 'value' }
      const result = sign(testObj)

      // Verify object was stringified and parsed (deep copy)
      expect(mockSafeStringify).toHaveBeenCalledWith(testObj)
      expect(mockSafeJsonParse).toHaveBeenCalledWith('{"test":"value"}')

      // Verify signObj was called with correct parameters
      expect(mockSignObj).toHaveBeenCalledWith({ test: 'value' }, 'mock-secret-key', 'mock-public-key')

      expect(result).toEqual({ test: 'value' })
    })

    it('should handle complex objects', () => {
      const mockSignObj = jest.fn()
      const complexObj = {
        id: 123,
        nested: {
          array: [1, 2, 3],
          bool: true,
          str: 'test',
        },
        timestamp: Date.now(),
      }

      const stringified = JSON.stringify(complexObj)
      const mockSafeStringify = jest.fn().mockReturnValue(stringified)
      const mockSafeJsonParse = jest.fn().mockReturnValue(JSON.parse(stringified))

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      const result = sign(complexObj)

      expect(mockSafeStringify).toHaveBeenCalledWith(complexObj)
      expect(mockSafeJsonParse).toHaveBeenCalledWith(stringified)
      expect(mockSignObj).toHaveBeenCalled()
    })

    it('should create a deep copy of the object', () => {
      const mockSignObj = jest.fn()
      const originalObj = { data: { value: 'original' } }

      // Mock to return a new object
      const mockSafeStringify = jest.fn().mockReturnValue('{"data":{"value":"original"}}')
      const mockSafeJsonParse = jest.fn().mockReturnValue({ data: { value: 'original' } })

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      const result = sign(originalObj)

      // Result should be a different object instance
      expect(result).not.toBe(originalObj)
      expect(result).toEqual(originalObj)
    })

    it('should handle arrays', () => {
      const mockSignObj = jest.fn()
      const testArray = [1, 2, 3, { nested: true }]

      const mockSafeStringify = jest.fn().mockReturnValue('[1,2,3,{"nested":true}]')
      const mockSafeJsonParse = jest.fn().mockReturnValue([1, 2, 3, { nested: true }])

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      const result = sign(testArray)

      expect(mockSignObj).toHaveBeenCalledWith([1, 2, 3, { nested: true }], 'mock-secret-key', 'mock-public-key')
      expect(result).toEqual(testArray)
    })

    it('should handle null and undefined values in objects', () => {
      const mockSignObj = jest.fn()
      const testObj = {
        nullValue: null,
        undefinedValue: undefined,
        validValue: 'test',
      }

      const mockSafeStringify = jest.fn().mockReturnValue('{"nullValue":null,"validValue":"test"}')
      const mockSafeJsonParse = jest.fn().mockReturnValue({ nullValue: null, validValue: 'test' })

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      sign(testObj)

      expect(mockSafeStringify).toHaveBeenCalledWith(testObj)
    })
  })

  describe('verify', () => {
    it('should verify a signed object', () => {
      const mockVerifyObj = jest.fn().mockReturnValue(true)
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj

      const signedObj = {
        data: 'test',
        sign: {
          owner: 'mock-public-key',
          sig: 'mock-signature',
        },
      }

      const result = verify(signedObj)

      expect(mockVerifyObj).toHaveBeenCalledWith(signedObj)
      expect(result).toBe(true)
    })

    it('should return false for invalid signature', () => {
      const mockVerifyObj = jest.fn().mockReturnValue(false)
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj

      const invalidSignedObj = {
        data: 'tampered',
        sign: {
          owner: 'mock-public-key',
          sig: 'invalid-signature',
        },
      }

      const result = verify(invalidSignedObj)

      expect(mockVerifyObj).toHaveBeenCalledWith(invalidSignedObj)
      expect(result).toBe(false)
    })

    it('should handle objects without signature', () => {
      const mockVerifyObj = jest.fn().mockReturnValue(false)
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj

      const unsignedObj = {
        data: 'test',
      } as any

      const result = verify(unsignedObj)

      expect(mockVerifyObj).toHaveBeenCalledWith(unsignedObj)
      expect(result).toBe(false)
    })

    it('should handle malformed signed objects', () => {
      const mockVerifyObj = jest.fn().mockReturnValue(false)
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj

      const malformedObjs = [
        { sign: {} }, // Missing data
        { data: 'test', sign: { owner: 'key' } }, // Missing sig
        { data: 'test', sign: { sig: 'sig' } }, // Missing owner
        null,
        undefined,
        'not an object',
      ]

      malformedObjs.forEach((obj) => {
        const result = verify(obj as any)
        expect(result).toBe(false)
      })
    })

    it('should pass through complex signed objects', () => {
      const mockVerifyObj = jest.fn().mockReturnValue(true)
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj

      const complexSignedObj = {
        data: {
          nested: {
            deeply: {
              value: 'test',
              array: [1, 2, 3],
            },
          },
        },
        timestamp: Date.now(),
        sign: {
          owner: 'mock-public-key',
          sig: 'complex-signature',
        },
      }

      const result = verify(complexSignedObj)

      expect(mockVerifyObj).toHaveBeenCalledWith(complexSignedObj)
      expect(result).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('should handle sign and verify workflow', () => {
      // Mock implementations
      const mockSignObj = jest.fn((obj, sk, pk) => {
        obj.sign = {
          owner: pk,
          sig: 'mock-signature',
        }
        return obj
      })
      const mockVerifyObj = jest.fn().mockReturnValue(true)
      const mockSafeStringify = jest.fn((obj) => JSON.stringify(obj))
      const mockSafeJsonParse = jest.fn((str) => JSON.parse(str))

      ;(core as jest.Mocked<typeof core>).signObj = mockSignObj
      ;(core as jest.Mocked<typeof core>).verifyObj = mockVerifyObj
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeStringify = mockSafeStringify
      ;(StringUtils as jest.Mocked<typeof StringUtils>).safeJsonParse = mockSafeJsonParse

      // Sign an object
      const originalObj = { message: 'Hello, World!' }
      const signedObj = sign(originalObj)

      // Verify the signed object
      const isValid = verify(signedObj)

      expect(isValid).toBe(true)
      expect(mockSignObj).toHaveBeenCalled()
      expect(mockVerifyObj).toHaveBeenCalled()
    })
  })
})
