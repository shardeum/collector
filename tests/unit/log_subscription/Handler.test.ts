import { SocketStream } from '@fastify/websocket'
import { evmLogSubscriptionHandler } from '../../../src/log_subscription/Handler'
import * as SocketManager from '../../../src/log_subscription/SocketManager'

// Mock the SocketManager module
jest.mock('../../../src/log_subscription/SocketManager')

describe('Handler - EVM Log Subscription', () => {
  let mockConnection: SocketStream
  let mockSend: jest.Mock
  const socketId = 'test-socket-123'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock connection
    mockSend = jest.fn()
    mockConnection = {
      socket: {
        send: mockSend,
      },
    } as any

    // Reset SocketManager mocks
    const mockedSocketManager = SocketManager as jest.Mocked<typeof SocketManager>
    mockedSocketManager.addLogSocketClient.mockClear()
    mockedSocketManager.addLogSubscriptions.mockClear()
    mockedSocketManager.removeLogSubscription.mockClear()
  })

  describe('Request Validation', () => {
    it('should reject non-object messages', async () => {
      const testCases = [
        { message: null, error: 'Request must be an object.' },
        { message: undefined, error: 'Request must be an object.' },
        { message: 'string', error: 'Request must be an object.' },
        { message: 123, error: 'Request must be an object.' },
        { message: true, error: 'Request must be an object.' },
        { message: [], error: 'method must be a string.' }, // Arrays are objects in JS
      ]

      for (const { message, error } of testCases) {
        await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

        expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ success: false, error }))
        mockSend.mockClear()
      }
    })

    it('should reject messages without method field', async () => {
      const message = { params: {} }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ success: false, error: 'method must be a string.' }))
    })

    it('should reject messages with non-string method', async () => {
      const invalidMethods = [123, true, {}, [], null]

      for (const method of invalidMethods) {
        await evmLogSubscriptionHandler.onMessage(mockConnection, { method }, socketId)

        expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ success: false, error: 'method must be a string.' }))
        mockSend.mockClear()
      }
    })

    it('should reject unknown methods', async () => {
      const message = { method: 'unknown_method' }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ success: false, error: 'invalid method' }))
    })
  })

  describe('Subscribe Method', () => {
    it('should handle valid subscribe request with address filter', async () => {
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: 'sub123',
          address: ['0x1234567890abcdef', '0xFEDCBA0987654321'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith('sub123', socketId, {
        address: ['0x1234567890abcdef', '0xfedcba0987654321'], // lowercase
        topics: [],
      })
      expect(SocketManager.addLogSocketClient).toHaveBeenCalledWith(socketId, mockConnection)
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'subscribe',
          success: true,
          subscription_id: 'sub123',
        })
      )
    })

    it('should handle valid subscribe request with topics filter', async () => {
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: 'sub456',
          topics: ['0xTOPIC1', '0xTOPIC2', '0xTOPIC3'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith('sub456', socketId, {
        address: [],
        topics: ['0xtopic1', '0xtopic2', '0xtopic3'], // lowercase
      })
    })

    it('should handle subscribe request with both address and topics', async () => {
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: 'sub789',
          address: ['0xADDRESS1'],
          topics: ['0xTOPIC1'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith('sub789', socketId, {
        address: ['0xaddress1'],
        topics: ['0xtopic1'],
      })
    })

    it('should reject subscribe without params', async () => {
      const message = { method: 'subscribe' }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ method: 'subscribe', success: false, error: 'params must be an object.' })
      )
    })

    it('should reject subscribe without subscription_id', async () => {
      const message = {
        method: 'subscribe',
        params: {
          address: ['0x123'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'subscribe',
          success: false,
          error: 'params.subscription_id must be a string.',
        })
      )
    })

    it('should reject subscribe without address or topics', async () => {
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: 'sub123',
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'subscribe',
          success: false,
          error: 'params.address or params.topics must be provided.',
        })
      )
    })

    it('should reject subscribe with invalid address array', async () => {
      const invalidAddresses = [
        { address: 'not-an-array' },
        { address: [123, 456] },
        { address: [null, undefined] },
        { address: ['valid', 123] },
      ]

      for (const params of invalidAddresses) {
        const message = {
          method: 'subscribe',
          params: {
            subscription_id: 'sub123',
            ...params,
          },
        }

        await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

        expect(mockSend).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'subscribe',
            success: false,
            error: 'params.address must be an array of strings.',
          })
        )
        mockSend.mockClear()
      }
    })

    it('should reject subscribe with invalid topics array', async () => {
      const testCases = [
        { params: { topics: 'not-an-array' }, error: 'params.topics must be an array.' },
        { params: { topics: [123, 456] }, error: 'params.topics must be an array of strings.' },
        { params: { topics: [null, undefined] }, error: 'params.topics must be an array of strings.' },
        { params: { topics: ['valid', false] }, error: 'params.topics must be an array of strings.' },
      ]

      for (const { params, error } of testCases) {
        const message = {
          method: 'subscribe',
          params: {
            subscription_id: 'sub123',
            ...params,
          },
        }

        await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

        expect(mockSend).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'subscribe',
            success: false,
            error,
          })
        )
        mockSend.mockClear()
      }
    })

    it('should handle empty arrays for address and topics', async () => {
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: 'sub123',
          address: [],
          topics: [],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith('sub123', socketId, {
        address: [],
        topics: [],
      })
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'subscribe',
          success: true,
          subscription_id: 'sub123',
        })
      )
    })
  })

  describe('Unsubscribe Method', () => {
    it('should handle valid unsubscribe request', async () => {
      const message = {
        method: 'unsubscribe',
        params: {
          subscription_id: 'sub123',
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.removeLogSubscription).toHaveBeenCalledWith('sub123')
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'unsubscribe',
          success: true,
          subscription_id: 'sub123',
        })
      )
    })

    it('should reject unsubscribe without params', async () => {
      const message = { method: 'unsubscribe' }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ method: 'unsubscribe', success: false, error: 'params must be an object.' })
      )
    })

    it('should reject unsubscribe without subscription_id', async () => {
      const message = {
        method: 'unsubscribe',
        params: {},
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'unsubscribe',
          success: false,
          error: 'params.subscription_id must be a string.',
        })
      )
    })

    it('should reject unsubscribe with non-string subscription_id', async () => {
      const invalidIds = [123, true, {}, [], null]

      for (const subscription_id of invalidIds) {
        const message = {
          method: 'unsubscribe',
          params: { subscription_id },
        }

        await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

        expect(mockSend).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'unsubscribe',
            success: false,
            error: 'params.subscription_id must be a string.',
          })
        )
        mockSend.mockClear()
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle params as null', async () => {
      const message = {
        method: 'subscribe',
        params: null,
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ method: 'subscribe', success: false, error: 'params must be an object.' })
      )
    })

    it('should handle extremely long subscription IDs', async () => {
      const longId = 'sub_' + 'x'.repeat(1000)
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: longId,
          address: ['0x123'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith(longId, socketId, {
        address: ['0x123'],
        topics: [],
      })
    })

    it('should handle special characters in subscription ID', async () => {
      const specialId = 'sub-123_456.789:abc@def'
      const message = {
        method: 'subscribe',
        params: {
          subscription_id: specialId,
          topics: ['0xtopic'],
        },
      }

      await evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledWith(specialId, socketId, {
        address: [],
        topics: ['0xtopic'],
      })
    })

    it('should handle socket send errors', async () => {
      mockSend.mockImplementation(() => {
        throw new Error('Socket closed')
      })

      const message = { method: 'invalid' }

      // Should throw since the handler doesn't catch the error
      await expect(evmLogSubscriptionHandler.onMessage(mockConnection, message, socketId)).rejects.toThrow(
        'Socket closed'
      )
    })

    it('should handle multiple rapid subscribe/unsubscribe cycles', async () => {
      const subscribeMsg = {
        method: 'subscribe',
        params: {
          subscription_id: 'rapid-sub',
          address: ['0x123'],
        },
      }

      const unsubscribeMsg = {
        method: 'unsubscribe',
        params: {
          subscription_id: 'rapid-sub',
        },
      }

      // Rapid subscribe/unsubscribe
      for (let i = 0; i < 5; i++) {
        await evmLogSubscriptionHandler.onMessage(mockConnection, subscribeMsg, socketId)
        await evmLogSubscriptionHandler.onMessage(mockConnection, unsubscribeMsg, socketId)
      }

      expect(SocketManager.addLogSubscriptions).toHaveBeenCalledTimes(5)
      expect(SocketManager.removeLogSubscription).toHaveBeenCalledTimes(5)
    })
  })
})
