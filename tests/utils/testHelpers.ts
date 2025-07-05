import { jest } from '@jest/globals'

// Environment setup helpers
export const setupTestEnvironment = (overrides = {}) => {
  const originalEnv = process.env
  
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ...overrides }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
}

// Timer helpers for testing time-based functionality
export const useTestTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })
  
  return {
    advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    runPendingTimers: () => jest.runOnlyPendingTimers(),
  }
}

// Async test helpers
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error(`Condition not met within ${timeout}ms`)
}

// Mock console helpers
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
    console.info = jest.fn()
    console.debug = jest.fn()
  })
  
  afterEach(() => {
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    console.debug = originalConsole.debug
  })
  
  return {
    getLogCalls: () => (console.log as jest.Mock).mock.calls,
    getErrorCalls: () => (console.error as jest.Mock).mock.calls,
    getWarnCalls: () => (console.warn as jest.Mock).mock.calls,
  }
}

// Error testing helpers
export const expectAsyncError = async (
  asyncFn: () => Promise<any>,
  errorMessage?: string | RegExp
): Promise<void> => {
  let error: Error | null = null
  
  try {
    await asyncFn()
  } catch (e) {
    error = e as Error
  }
  
  expect(error).not.toBeNull()
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toBe(errorMessage)
    } else {
      expect(error?.message).toMatch(errorMessage)
    }
  }
}

// Module mock helpers
export const createModuleMock = <T>(modulePath: string, mockImplementation: Partial<T>) => {
  jest.mock(modulePath, () => mockImplementation)
  return mockImplementation
}

// Spy helpers
export const spyOnModule = <T>(module: T, method: keyof T) => {
  return jest.spyOn(module, method as any)
}

// Test data cleanup helpers
export class TestDataManager {
  private cleanupFns: Array<() => void | Promise<void>> = []
  
  addCleanup(fn: () => void | Promise<void>): void {
    this.cleanupFns.push(fn)
  }
  
  async cleanup(): Promise<void> {
    for (const fn of this.cleanupFns.reverse()) {
      await fn()
    }
    this.cleanupFns = []
  }
}

// Performance testing helpers
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  
  console.log(`${label}: ${duration.toFixed(2)}ms`)
  
  return { result, duration }
}

// Snapshot testing helpers
export const createSnapshotMatcher = (transformer?: (data: any) => any) => {
  return (data: any) => {
    const transformed = transformer ? transformer(data) : data
    expect(transformed).toMatchSnapshot()
  }
}

// Test isolation helpers
export const isolateTest = (testFn: () => void | Promise<void>) => {
  return async () => {
    // Save current state
    const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    
    try {
      await testFn()
    } finally {
      // Restore state
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
      jest.clearAllMocks()
      jest.clearAllTimers()
    }
  }
}