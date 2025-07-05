// Global test setup
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'

// Increase test timeout for debugging
if (process.env.DEBUG) {
  jest.setTimeout(300000)
}

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Restore console for test output
const originalConsoleLog = console.log
beforeEach(() => {
  // Allow console.log in tests for debugging
  ;(console.log as jest.Mock).mockImplementation((...args) => {
    if (args[0]?.includes?.('✓') || args[0]?.includes?.('✗')) {
      originalConsoleLog(...args)
    }
  })
})

afterEach(() => {
  jest.clearAllMocks()
})