import { blockQueryDelayInMillis } from '../../../src/utils/block'
import { config } from '../../../src/config'

// Mock the config module
jest.mock('../../../src/config', () => ({
  config: {
    blockIndexing: {
      latestBehindBySeconds: 60,
    },
    verbose: false,
  },
}))

describe('Utils - block.ts', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    // Reset config values to defaults
    config.blockIndexing.latestBehindBySeconds = 60
    config.verbose = false

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('blockQueryDelayInMillis', () => {
    it('should return delay in milliseconds based on config', () => {
      config.blockIndexing.latestBehindBySeconds = 60
      expect(blockQueryDelayInMillis()).toBe(60000)

      config.blockIndexing.latestBehindBySeconds = 30
      expect(blockQueryDelayInMillis()).toBe(30000)

      config.blockIndexing.latestBehindBySeconds = 120
      expect(blockQueryDelayInMillis()).toBe(120000)
    })

    it('should handle zero delay', () => {
      config.blockIndexing.latestBehindBySeconds = 0
      expect(blockQueryDelayInMillis()).toBe(0)
    })

    it('should handle fractional seconds', () => {
      config.blockIndexing.latestBehindBySeconds = 1.5
      expect(blockQueryDelayInMillis()).toBe(1500)

      config.blockIndexing.latestBehindBySeconds = 0.1
      expect(blockQueryDelayInMillis()).toBe(100)

      config.blockIndexing.latestBehindBySeconds = 2.75
      expect(blockQueryDelayInMillis()).toBe(2750)
    })

    it('should not log when verbose is false', () => {
      config.verbose = false
      config.blockIndexing.latestBehindBySeconds = 60

      const result = blockQueryDelayInMillis()

      expect(result).toBe(60000)
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should log delay when verbose is true', () => {
      config.verbose = true
      config.blockIndexing.latestBehindBySeconds = 45

      const result = blockQueryDelayInMillis()

      expect(result).toBe(45000)
      expect(consoleLogSpy).toHaveBeenCalledWith('block: Querying block delay', 45000)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    })

    it('should calculate delay correctly for various config values', () => {
      const testCases = [
        { seconds: 1, expectedMillis: 1000 },
        { seconds: 10, expectedMillis: 10000 },
        { seconds: 60, expectedMillis: 60000 },
        { seconds: 300, expectedMillis: 300000 },
        { seconds: 3600, expectedMillis: 3600000 },
      ]

      testCases.forEach(({ seconds, expectedMillis }) => {
        config.blockIndexing.latestBehindBySeconds = seconds
        expect(blockQueryDelayInMillis()).toBe(expectedMillis)
      })
    })

    it('should handle negative values (edge case)', () => {
      // Note: Negative delays might not make logical sense but the function should handle them
      config.blockIndexing.latestBehindBySeconds = -10
      expect(blockQueryDelayInMillis()).toBe(-10000)
    })

    it('should handle very large delay values', () => {
      config.blockIndexing.latestBehindBySeconds = 86400 // 24 hours
      expect(blockQueryDelayInMillis()).toBe(86400000)

      config.blockIndexing.latestBehindBySeconds = 604800 // 1 week
      expect(blockQueryDelayInMillis()).toBe(604800000)
    })

    it('should maintain consistency across multiple calls', () => {
      config.blockIndexing.latestBehindBySeconds = 30

      const result1 = blockQueryDelayInMillis()
      const result2 = blockQueryDelayInMillis()
      const result3 = blockQueryDelayInMillis()

      expect(result1).toBe(30000)
      expect(result2).toBe(30000)
      expect(result3).toBe(30000)
    })

    it('should reflect config changes immediately', () => {
      config.blockIndexing.latestBehindBySeconds = 10
      expect(blockQueryDelayInMillis()).toBe(10000)

      config.blockIndexing.latestBehindBySeconds = 20
      expect(blockQueryDelayInMillis()).toBe(20000)

      config.blockIndexing.latestBehindBySeconds = 5
      expect(blockQueryDelayInMillis()).toBe(5000)
    })

    it('should log each time when verbose is true', () => {
      config.verbose = true
      config.blockIndexing.latestBehindBySeconds = 15

      blockQueryDelayInMillis()
      blockQueryDelayInMillis()
      blockQueryDelayInMillis()

      expect(consoleLogSpy).toHaveBeenCalledTimes(3)
      expect(consoleLogSpy).toHaveBeenCalledWith('block: Querying block delay', 15000)
    })
  })
})
