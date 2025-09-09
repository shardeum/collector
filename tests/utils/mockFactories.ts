import {
  generateAddress,
  generateTxHash,
  generateBlockHash,
  generateTimestamp,
  generateMockSignature,
} from './testUtils'

// Account mock factory
export const createMockAccount = (overrides = {}) => {
  return {
    accountId: generateAddress(),
    timestamp: generateTimestamp(),
    balance: '1000000000000000000', // 1 ETH in wei
    nonce: 0,
    codeHash: generateTxHash(),
    storageRoot: generateTxHash(),
    cycle: 1,
    ...overrides,
  }
}

// Transaction mock factory
export const createMockTransaction = (overrides = {}) => {
  return {
    txId: generateTxHash(),
    timestamp: generateTimestamp(),
    cycleNumber: 1,
    blockNumber: 1,
    blockHash: generateBlockHash(),
    from: generateAddress(),
    to: generateAddress(),
    value: '1000000000000000000', // 1 ETH in wei
    gas: '21000',
    gasPrice: '20000000000', // 20 gwei
    nonce: 0,
    data: '0x',
    v: '0x1c',
    r: generateTxHash(),
    s: generateTxHash(),
    txHash: generateTxHash(),
    transactionIndex: 0,
    cumulativeGasUsed: '21000',
    gasUsed: '21000',
    logs: [],
    logsBloom: '0x' + '0'.repeat(512),
    status: 1,
    contractAddress: null,
    sign: generateMockSignature(),
    ...overrides,
  }
}

// Receipt mock factory
export const createMockReceipt = (overrides = {}) => {
  const tx = createMockTransaction()
  return {
    receiptId: generateTxHash(),
    txId: tx.txId,
    timestamp: tx.timestamp,
    cycleNumber: tx.cycleNumber,
    blockNumber: tx.blockNumber,
    blockHash: tx.blockHash,
    from: tx.from,
    to: tx.to,
    transactionHash: tx.txHash,
    transactionIndex: tx.transactionIndex,
    cumulativeGasUsed: tx.cumulativeGasUsed,
    gasUsed: tx.gasUsed,
    logs: [],
    logsBloom: tx.logsBloom,
    status: tx.status,
    contractAddress: tx.contractAddress,
    sign: generateMockSignature(),
    ...overrides,
  }
}

// Block mock factory
export const createMockBlock = (overrides = {}) => {
  return {
    number: 1,
    hash: generateBlockHash(),
    parentHash: generateBlockHash(),
    nonce: '0x0000000000000000',
    sha3Uncles: generateTxHash(),
    logsBloom: '0x' + '0'.repeat(512),
    transactionsRoot: generateTxHash(),
    stateRoot: generateTxHash(),
    receiptsRoot: generateTxHash(),
    miner: generateAddress(),
    difficulty: '0',
    totalDifficulty: '0',
    extraData: '0x',
    size: '1000',
    gasLimit: '8000000',
    gasUsed: '21000',
    timestamp: generateTimestamp(),
    transactions: [],
    uncles: [],
    baseFeePerGas: '7',
    ...overrides,
  }
}

// Cycle mock factory
export const createMockCycle = (overrides = {}) => {
  return {
    cycleRecord: {
      counter: 1,
      cycleMarker: generateTxHash(),
      mode: 'normal',
      previous: generateTxHash(),
      start: generateTimestamp(),
      duration: 60,
      networkConfigHash: generateTxHash(),
      active: 10,
      syncing: 0,
      lost: [],
      apoptosized: [],
      joined: [],
      activated: [],
      removed: [],
      networkId: 'testnet',
    },
    cycleInfo: {
      counter: 1,
      mode: 'normal',
      syncingCount: 0,
      activeCount: 10,
      lostCount: 0,
      apoptosizedCount: 0,
      joinedCount: 0,
      activatedCount: 0,
      removedCount: 0,
      networkId: 'testnet',
    },
    sign: generateMockSignature(),
    ...overrides,
  }
}

// WebSocket message mock factory
export const createMockWebSocketMessage = (type: string, data: any) => {
  return {
    type,
    data,
    timestamp: generateTimestamp(),
  }
}

// RabbitMQ message mock factory
export const createMockRabbitMQMessage = (data: any) => {
  return {
    content: Buffer.from(JSON.stringify(data)),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange',
      routingKey: 'test-routing-key',
    },
    properties: {
      contentType: 'application/json',
      headers: {},
      deliveryMode: 2,
      priority: 0,
      timestamp: generateTimestamp(),
    },
  }
}

// Distributor node response mock factory
export const createMockDistributorResponse = (endpoint: string, data: any) => {
  return {
    success: true,
    data,
    endpoint,
    timestamp: generateTimestamp(),
  }
}

// Error response mock factory
export const createMockErrorResponse = (message = 'Test error', code = 'TEST_ERROR') => {
  return {
    success: false,
    error: {
      message,
      code,
    },
  }
}
