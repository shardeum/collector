import { EventEmitter } from 'events'

// WebSocket mock
export class MockWebSocket extends EventEmitter {
  readyState: number = 1 // OPEN
  url: string
  
  constructor(url: string) {
    super()
    this.url = url
  }

  send(data: any): void {
    // Mock send implementation
    this.emit('send', data)
  }

  close(): void {
    this.readyState = 3 // CLOSED
    this.emit('close')
  }

  ping(): void {
    this.emit('ping')
  }

  pong(): void {
    this.emit('pong')
  }

  // Simulate receiving a message
  simulateMessage(data: any): void {
    this.emit('message', { data: JSON.stringify(data) })
  }

  // Simulate an error
  simulateError(error: Error): void {
    this.emit('error', error)
  }

  // Simulate connection open
  simulateOpen(): void {
    this.readyState = 1
    this.emit('open')
  }

  // Simulate connection close
  simulateClose(code = 1000, reason = 'Normal closure'): void {
    this.readyState = 3
    this.emit('close', code, reason)
  }
}

// Socket.IO mock
export class MockSocketIO extends EventEmitter {
  connected = true
  id = 'mock-socket-id'
  
  connect(): void {
    this.connected = true
    this.emit('connect')
  }

  disconnect(): void {
    this.connected = false
    this.emit('disconnect')
  }

  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener)
  }
}

// RabbitMQ Channel mock
export class MockRabbitMQChannel extends EventEmitter {
  assertQueue = jest.fn().mockResolvedValue({ queue: 'test-queue' })
  bindQueue = jest.fn().mockResolvedValue({})
  consume = jest.fn()
  ack = jest.fn()
  nack = jest.fn()
  prefetch = jest.fn()
  close = jest.fn().mockResolvedValue({})
  
  simulateMessage(data: any, deliveryTag = 1): void {
    const message = {
      content: Buffer.from(JSON.stringify(data)),
      fields: {
        deliveryTag,
        redelivered: false,
        exchange: 'test-exchange',
        routingKey: 'test-routing-key',
      },
      properties: {
        contentType: 'application/json',
        headers: {},
      },
    }
    
    // Call the consumer callback if it was registered
    if (this.consume.mock.calls.length > 0) {
      const consumerCallback = this.consume.mock.calls[0][1]
      consumerCallback(message)
    }
  }
}

// RabbitMQ Connection mock
export class MockRabbitMQConnection extends EventEmitter {
  createChannel = jest.fn().mockResolvedValue(new MockRabbitMQChannel())
  close = jest.fn().mockResolvedValue({})
  
  simulateError(error: Error): void {
    this.emit('error', error)
  }
  
  simulateClose(): void {
    this.emit('close')
  }
}

// HTTP/Axios mock responses
export const createMockAxiosResponse = <T>(data: T, status = 200) => {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'application/json',
    },
    config: {},
  }
}

// Fastify mock utilities
export const createMockFastifyRequest = (overrides = {}) => {
  return {
    query: {},
    params: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides,
  }
}

export const createMockFastifyReply = () => {
  const reply = {
    code: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    sent: false,
  }
  return reply
}

// Mock WebSocket server for testing
export class MockWebSocketServer extends EventEmitter {
  clients = new Set<MockWebSocket>()
  
  handleUpgrade(request: any, socket: any, head: any, callback: (ws: MockWebSocket) => void): void {
    const ws = new MockWebSocket('ws://test')
    this.clients.add(ws)
    callback(ws)
  }
  
  close(): void {
    this.clients.forEach(client => client.close())
    this.clients.clear()
    this.emit('close')
  }
}

// Network delay simulator
export const simulateNetworkDelay = (ms = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Connection retry simulator
export const createMockRetryableConnection = () => {
  let attempts = 0
  const maxAttempts = 3
  
  return {
    connect: jest.fn().mockImplementation(async () => {
      attempts++
      if (attempts < maxAttempts) {
        throw new Error('Connection failed')
      }
      return new MockRabbitMQConnection()
    }),
    getAttempts: () => attempts,
    reset: () => { attempts = 0 },
  }
}