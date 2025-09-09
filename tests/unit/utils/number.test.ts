import { isNumber } from '../../../src/utils/number'

describe('Utils - number.ts', () => {
  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true)
      expect(isNumber(1)).toBe(true)
      expect(isNumber(-1)).toBe(true)
      expect(isNumber(42)).toBe(true)
      expect(isNumber(-42)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(-3.14)).toBe(true)
      expect(isNumber(0.0)).toBe(true)
    })

    it('should return true for special numeric values', () => {
      expect(isNumber(Infinity)).toBe(true)
      expect(isNumber(-Infinity)).toBe(true)
      expect(isNumber(Number.MAX_VALUE)).toBe(true)
      expect(isNumber(Number.MIN_VALUE)).toBe(true)
      expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true)
      expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true)
      expect(isNumber(Number.EPSILON)).toBe(true)
    })

    it('should return true for numbers in scientific notation', () => {
      expect(isNumber(1e5)).toBe(true)
      expect(isNumber(1e-5)).toBe(true)
      expect(isNumber(1.23e10)).toBe(true)
      expect(isNumber(-1.23e-10)).toBe(true)
    })

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false)
      expect(isNumber(Number.NaN)).toBe(false)
      expect(isNumber(0 / 0)).toBe(false)
      expect(isNumber(Math.sqrt(-1))).toBe(false)
      expect(isNumber(parseFloat('not a number'))).toBe(false)
    })

    it('should return false for non-number types', () => {
      expect(isNumber('42')).toBe(false)
      expect(isNumber('0')).toBe(false)
      expect(isNumber('')).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber(false)).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
      expect(isNumber([])).toBe(false)
      expect(isNumber([42])).toBe(false)
      expect(isNumber({ value: 42 })).toBe(false)
      expect(isNumber(() => 42)).toBe(false)
      expect(isNumber(Symbol('42'))).toBe(false)
      expect(isNumber(BigInt(42))).toBe(false)
    })

    it('should return false for number-like strings', () => {
      expect(isNumber('123')).toBe(false)
      expect(isNumber('123.45')).toBe(false)
      expect(isNumber('1e5')).toBe(false)
      expect(isNumber('Infinity')).toBe(false)
      expect(isNumber('-Infinity')).toBe(false)
      expect(isNumber('NaN')).toBe(false)
    })

    it('should handle edge cases with type coercion', () => {
      // These should all be false because they're not actually numbers
      expect(isNumber(new Number(42))).toBe(false) // Number object, not primitive
      expect(isNumber(+'42')).toBe(true) // Unary plus converts to number
      expect(isNumber(Number('42'))).toBe(true) // Number constructor converts
      expect(isNumber(parseInt('42'))).toBe(true) // parseInt returns number
      expect(isNumber(parseFloat('42.5'))).toBe(true) // parseFloat returns number
    })

    it('should handle arithmetic results', () => {
      expect(isNumber(1 + 1)).toBe(true)
      expect(isNumber(10 - 5)).toBe(true)
      expect(isNumber(2 * 3)).toBe(true)
      expect(isNumber(10 / 2)).toBe(true)
      expect(isNumber(10 % 3)).toBe(true)
      expect(isNumber(Math.PI)).toBe(true)
      expect(isNumber(Math.E)).toBe(true)
      expect(isNumber(Math.random())).toBe(true)
    })

    it('should correctly identify the type at runtime', () => {
      const values: unknown[] = [42, '42', NaN, null, undefined, true]
      const results = values.map(isNumber)

      expect(results).toEqual([true, false, false, false, false, false])
    })

    it('should work with type guards', () => {
      const unknownValue: unknown = 42

      if (isNumber(unknownValue)) {
        // TypeScript should now know this is a number
        const doubled: number = (unknownValue as number) * 2
        expect(doubled).toBe(84)
      }
    })
  })
})
