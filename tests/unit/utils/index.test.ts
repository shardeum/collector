import { short, validateTypes, sleep } from '../../../src/utils/index'

describe('Utils - index.ts', () => {
  describe('short', () => {
    it('should truncate strings longer than 8 characters', () => {
      expect(short('abcdefghijklmnop')).toBe('abcdefgh')
      expect(short('123456789')).toBe('12345678')
    })

    it('should return strings shorter than 8 characters unchanged', () => {
      expect(short('abc')).toBe('abc')
      expect(short('1234567')).toBe('1234567')
      expect(short('')).toBe('')
    })

    it('should return exactly 8 character strings unchanged', () => {
      expect(short('12345678')).toBe('12345678')
    })

    it('should handle special characters and unicode', () => {
      // Note: Unicode emojis may take more than 1 character position
      // The short function uses slice(0, 8) which may cut emojis in half
      const emojiString = '🚀🌟💫✨🎉🎊🌈🦄'
      const result = short(emojiString)
      expect(result.length).toBeLessThanOrEqual(8)
      
      expect(short('special!@#$%^&*()')).toBe('special!')
    })
  })

  describe('validateTypes', () => {
    describe('input validation', () => {
      it('should return error for undefined input', () => {
        expect(validateTypes(undefined as any, {})).toBe('input is undefined')
      })

      it('should return error for null input', () => {
        expect(validateTypes(null as any, {})).toBe('input is null')
      })

      it('should return error for non-object input', () => {
        expect(validateTypes('string' as any, {})).toBe('input must be object, not string')
        expect(validateTypes(123 as any, {})).toBe('input must be object, not number')
        expect(validateTypes(true as any, {})).toBe('input must be object, not boolean')
      })
    })

    describe('required field validation', () => {
      it('should validate required string fields', () => {
        const def = { name: 's', email: 's' }
        
        expect(validateTypes({ name: 'John', email: 'john@example.com' }, def)).toBe('')
        expect(validateTypes({ name: 'John' }, def)).toBe('email is required')
        expect(validateTypes({ email: 'john@example.com' }, def)).toBe('name is required')
        expect(validateTypes({}, def)).toBe('name is required')
      })

      it('should validate required number fields', () => {
        const def = { age: 'n', score: 'n' }
        
        expect(validateTypes({ age: 25, score: 100 }, def)).toBe('')
        expect(validateTypes({ age: 25 }, def)).toBe('score is required')
        expect(validateTypes({ age: '25', score: 100 }, def)).toBe('age must be, number')
      })

      it('should validate required boolean fields', () => {
        const def = { active: 'b', verified: 'b' }
        
        expect(validateTypes({ active: true, verified: false }, def)).toBe('')
        expect(validateTypes({ active: true }, def)).toBe('verified is required')
        expect(validateTypes({ active: 'true', verified: false }, def)).toBe('active must be, boolean')
      })

      it('should validate required bigint fields', () => {
        const def = { value: 'B' }
        
        expect(validateTypes({ value: BigInt(123) }, def)).toBe('')
        expect(validateTypes({ value: 123 }, def)).toBe('value must be, bigint')
        expect(validateTypes({}, def)).toBe('value is required')
      })

      it('should validate required array fields', () => {
        const def = { items: 'a', tags: 'a' }
        
        expect(validateTypes({ items: [1, 2, 3], tags: ['a', 'b'] }, def)).toBe('')
        expect(validateTypes({ items: [], tags: [] }, def)).toBe('')
        expect(validateTypes({ items: 'not array', tags: [] }, def)).toBe('items must be, array')
        expect(validateTypes({ items: [] }, def)).toBe('tags is required')
      })

      it('should validate required object fields', () => {
        const def = { config: 'o', metadata: 'o' }
        
        expect(validateTypes({ config: {}, metadata: { key: 'value' } }, def)).toBe('')
        expect(validateTypes({ config: [], metadata: {} }, def)).toBe('config must be, object')
        expect(validateTypes({ config: {} }, def)).toBe('metadata is required')
      })
    })

    describe('optional field validation', () => {
      it('should allow optional fields to be missing', () => {
        const def = { name: 's', age: 'n?', email: 's?' }
        
        expect(validateTypes({ name: 'John' }, def)).toBe('')
        expect(validateTypes({ name: 'John', age: 25 }, def)).toBe('')
        expect(validateTypes({ name: 'John', email: 'john@example.com' }, def)).toBe('')
        expect(validateTypes({ name: 'John', age: 25, email: 'john@example.com' }, def)).toBe('')
      })

      it('should validate optional fields when present', () => {
        const def = { name: 's', age: 'n?' }
        
        expect(validateTypes({ name: 'John', age: 'not a number' }, def)).toBe('age must be, number')
      })

      it('should handle null values for optional fields', () => {
        const def = { name: 's', age: 'n?' }
        
        // null is not a valid number, even for optional fields
        expect(validateTypes({ name: 'John', age: null }, def)).toBe('age must be, number')
      })

      it('should not allow null for required fields', () => {
        const def = { name: 's', age: 'n' }
        
        expect(validateTypes({ name: null, age: 25 }, def)).toBe('name cannot be null')
        expect(validateTypes({ name: 'John', age: null }, def)).toBe('age cannot be null')
      })
    })

    describe('multi-type field validation', () => {
      it('should allow fields with multiple valid types', () => {
        const def = { value: 'sn' } // string or number
        
        expect(validateTypes({ value: 'text' }, def)).toBe('')
        expect(validateTypes({ value: 123 }, def)).toBe('')
        expect(validateTypes({ value: true }, def)).toBe('value must be, string, number')
      })

      it('should handle optional multi-type fields', () => {
        const def = { value: 'sn?' } // optional string or number
        
        expect(validateTypes({}, def)).toBe('')
        expect(validateTypes({ value: 'text' }, def)).toBe('')
        expect(validateTypes({ value: 123 }, def)).toBe('')
        expect(validateTypes({ value: null }, def)).toBe('value must be, string, number')
        expect(validateTypes({ value: [] }, def)).toBe('value must be, string, number')
      })

      it('should validate complex multi-type combinations', () => {
        const def = { data: 'sao' } // string, array, or object
        
        expect(validateTypes({ data: 'text' }, def)).toBe('')
        expect(validateTypes({ data: [1, 2, 3] }, def)).toBe('')
        expect(validateTypes({ data: { key: 'value' } }, def)).toBe('')
        expect(validateTypes({ data: 123 }, def)).toBe('data must be, string, array, object')
      })
    })

    describe('edge cases', () => {
      it('should handle empty definition object', () => {
        expect(validateTypes({ any: 'field' }, {})).toBe('')
      })

      it('should only check fields defined in def', () => {
        const def = { name: 's' }
        
        expect(validateTypes({ name: 'John', extra: 'field', another: 123 }, def)).toBe('')
      })

      it('should handle arrays correctly (not as objects)', () => {
        const def = { items: 'a', config: 'o' }
        
        expect(validateTypes({ items: [], config: [] }, def)).toBe('config must be, object')
        expect(validateTypes({ items: {}, config: {} }, def)).toBe('items must be, array')
      })

      it('should validate fields in order and return first error', () => {
        const def = { first: 's', second: 'n', third: 'b' }
        
        expect(validateTypes({ second: 'wrong', third: 'wrong' }, def)).toBe('first is required')
        expect(validateTypes({ first: 'ok', second: 'wrong', third: 'wrong' }, def))
          .toBe('second must be, number')
      })
    })
  })

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve after specified time', async () => {
      const sleepPromise = sleep(1000)
      
      // Should not resolve immediately
      expect(jest.getTimerCount()).toBe(1)
      
      // Fast-forward time
      jest.advanceTimersByTime(999)
      expect(jest.getTimerCount()).toBe(1)
      
      // Complete the timeout
      jest.advanceTimersByTime(1)
      
      const result = await sleepPromise
      expect(result).toBe(true)
    })

    it('should handle different time values', async () => {
      const sleep0 = sleep(0)
      jest.advanceTimersByTime(0)
      expect(await sleep0).toBe(true)

      const sleep100 = sleep(100)
      jest.advanceTimersByTime(100)
      expect(await sleep100).toBe(true)

      const sleep5000 = sleep(5000)
      jest.advanceTimersByTime(5000)
      expect(await sleep5000).toBe(true)
    })

    it('should handle multiple concurrent sleeps', async () => {
      const sleep1 = sleep(100)
      const sleep2 = sleep(200)
      const sleep3 = sleep(300)

      jest.advanceTimersByTime(100)
      expect(await sleep1).toBe(true)
      
      jest.advanceTimersByTime(100)
      expect(await sleep2).toBe(true)
      
      jest.advanceTimersByTime(100)
      expect(await sleep3).toBe(true)
    })

    it('should always resolve to true', async () => {
      const times = [0, 1, 10, 100, 1000]
      
      for (const time of times) {
        const result = sleep(time)
        jest.advanceTimersByTime(time)
        expect(await result).toBe(true)
      }
    })
  })
})