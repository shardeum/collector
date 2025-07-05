import { bigIntToHex } from '../../../src/utils/string'

describe('Utils - string.ts', () => {
  describe('bigIntToHex', () => {
    it('should convert positive bigints to hex with 0x prefix', () => {
      expect(bigIntToHex(BigInt(0))).toBe('0x0')
      expect(bigIntToHex(BigInt(1))).toBe('0x1')
      expect(bigIntToHex(BigInt(15))).toBe('0xf')
      expect(bigIntToHex(BigInt(16))).toBe('0x10')
      expect(bigIntToHex(BigInt(255))).toBe('0xff')
      expect(bigIntToHex(BigInt(256))).toBe('0x100')
    })

    it('should handle large bigints', () => {
      expect(bigIntToHex(BigInt('1000000000000000000'))).toBe('0xde0b6b3a7640000')
      expect(bigIntToHex(BigInt('9999999999999999999'))).toBe('0x8ac7230489e7ffff')
      expect(bigIntToHex(BigInt('18446744073709551615'))).toBe('0xffffffffffffffff') // Max uint64
    })

    it('should handle very large bigints beyond Number.MAX_SAFE_INTEGER', () => {
      const veryLarge = BigInt('123456789012345678901234567890')
      expect(bigIntToHex(veryLarge)).toBe('0x18ee90ff6c373e0ee4e3f0ad2')
      
      const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')
      expect(bigIntToHex(maxUint256)).toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    })

    it('should handle negative bigints', () => {
      // Note: JavaScript bigint.toString(16) for negative numbers returns negative hex
      expect(bigIntToHex(BigInt(-1))).toBe('0x-1')
      expect(bigIntToHex(BigInt(-16))).toBe('0x-10')
      expect(bigIntToHex(BigInt(-255))).toBe('0x-ff')
      expect(bigIntToHex(BigInt(-256))).toBe('0x-100')
    })

    it('should handle edge cases', () => {
      // Zero
      expect(bigIntToHex(BigInt(0))).toBe('0x0')
      
      // Powers of 2
      expect(bigIntToHex(BigInt(2) ** BigInt(8))).toBe('0x100')
      expect(bigIntToHex(BigInt(2) ** BigInt(16))).toBe('0x10000')
      expect(bigIntToHex(BigInt(2) ** BigInt(32))).toBe('0x100000000')
      expect(bigIntToHex(BigInt(2) ** BigInt(64))).toBe('0x10000000000000000')
    })

    it('should produce lowercase hex digits', () => {
      expect(bigIntToHex(BigInt(10))).toBe('0xa')
      expect(bigIntToHex(BigInt(11))).toBe('0xb')
      expect(bigIntToHex(BigInt(12))).toBe('0xc')
      expect(bigIntToHex(BigInt(13))).toBe('0xd')
      expect(bigIntToHex(BigInt(14))).toBe('0xe')
      expect(bigIntToHex(BigInt(15))).toBe('0xf')
      expect(bigIntToHex(BigInt(171))).toBe('0xab')
      expect(bigIntToHex(BigInt(205))).toBe('0xcd')
      expect(bigIntToHex(BigInt(239))).toBe('0xef')
    })

    it('should not include leading zeros', () => {
      expect(bigIntToHex(BigInt(1))).toBe('0x1')
      expect(bigIntToHex(BigInt(1))).not.toBe('0x01')
      expect(bigIntToHex(BigInt(15))).toBe('0xf')
      expect(bigIntToHex(BigInt(15))).not.toBe('0x0f')
    })

    it('should handle conversion consistency', () => {
      // Test that converting back gives the same value
      const testValues = [
        BigInt(0),
        BigInt(1),
        BigInt(123456),
        BigInt('999999999999999999'),
        BigInt('12345678901234567890'),
      ]

      testValues.forEach(value => {
        const hex = bigIntToHex(value)
        const converted = BigInt(hex)
        expect(converted).toEqual(value)
      })
    })
  })
})