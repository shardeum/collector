import { Signature } from '@shardeum-foundation/lib-crypto-utils'

// Test data generators
export const generateRandomHex = (length = 64): string => {
  const chars = '0123456789abcdef'
  let result = '0x'
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export const generateAddress = (): string => {
  return generateRandomHex(40)
}

export const generateTxHash = (): string => {
  return generateRandomHex(64)
}

export const generateBlockHash = (): string => {
  return generateRandomHex(64)
}

export const generateTimestamp = (): number => {
  return Math.floor(Date.now() / 1000)
}

// Mock signature for testing
export const generateMockSignature = (): Signature => {
  return {
    owner: generateAddress(),
    sig: generateRandomHex(128),
  }
}

// Delay utility for async tests
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Database test utilities
export const cleanDatabase = async (db: any): Promise<void> => {
  const tables = ['accounts', 'transactions', 'receipts', 'blocks', 'cycles', 'originalTxsData']
  for (const table of tables) {
    await db.run(`DELETE FROM ${table}`)
  }
}

// Mock response builders
export const buildMockApiResponse = <T>(data: T, success = true) => {
  return {
    success,
    data,
    error: success ? null : 'Test error',
  }
}

// Test assertion helpers
export const expectToBeHex = (value: string, length?: number): void => {
  expect(value).toMatch(/^0x[0-9a-f]+$/i)
  if (length) {
    expect(value.length).toBe(length + 2) // +2 for '0x' prefix
  }
}

export const expectToBeAddress = (value: string): void => {
  expectToBeHex(value, 40)
}

export const expectToBeTxHash = (value: string): void => {
  expectToBeHex(value, 64)
}