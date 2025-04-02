import { Server, Socket } from 'socket.io'
import { Data } from '../class/validateData'
import { config as CONFIG } from '../config'
import { Receipt } from '../types'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'

// constants
const ConnectionEvent = 'connection'
const DisconnectionEvent = 'disconnect'
const ErrorEvent = 'error'

export const CycleDataWsEvent = '/data/cycle'
export const ReceiptDataWsEvent = '/data/receipt'
export const BlockDataWsEvent = '/data/block'

const registeredLogServers = new Map<string, Socket>()

export const setupCollectorSocketServer = (): void => {
  const socketServer = new Server()

  socketServer.on(ConnectionEvent, (socket) => {
    console.log(`New LogServer registered ${socket.id}`)
    registeredLogServers.set(socket.id, socket)
    socket.on(DisconnectionEvent, () => {
      console.log(`LogServer ${socket.id} disconnected`)
      registeredLogServers.delete(socket.id)
    })
    socket.on(ErrorEvent, (err) => {
      console.log(`LogServer ${socket.id} error: ${err}. Disconnecting...`)
      registeredLogServers.delete(socket.id)
      socket.disconnect()
    })
  })

  socketServer.listen(Number(CONFIG.port.collector))
  console.log(`LogServer sender listening on port ${CONFIG.port.collector}`)
}

export const forwardCycleData = async (data: Data): Promise<void> => {
  for (const socket of registeredLogServers.values()) {
    socket.emit(CycleDataWsEvent, StringUtils.safeStringify(data))
  }
  console.log(`Forwarded cycle data to ${registeredLogServers.size} LogServers`)
}

export const forwardReceiptData = async (data: Receipt[]): Promise<void> => {
  for (const socket of registeredLogServers.values()) {
    socket.emit(ReceiptDataWsEvent, StringUtils.safeStringify(data))
  }
  /* prettier-ignore */ if (CONFIG.verbose) console.log(`Forwarded receipt data to ${registeredLogServers.size} LogServers`)
}

// Queue to store blocks that are less than a minute old
const pendingBlocksQueue: { blockData: any; timestamp: number }[] = []

// Function to process the pending blocks queue
const processPendingBlocks = (): void => {
  const currentTime = Date.now()
  const oneCycleDurationAgo = currentTime - CONFIG.blockIndexing.cycleDurationInSeconds * 1000 // 60 seconds * 1000 ms

  // Process blocks that are now at least a minute old
  while (pendingBlocksQueue.length > 0 && pendingBlocksQueue[0].timestamp <= oneCycleDurationAgo) {
    const { blockData } = pendingBlocksQueue.shift()!

    for (const socket of registeredLogServers.values()) {
      socket.emit(BlockDataWsEvent, StringUtils.safeStringify(blockData))
    }
    /* prettier-ignore */ if (CONFIG.verbose) console.log(`Forwarded queued block data to ${registeredLogServers.size} LogServers`);
  }

  // Schedule next check if there are still pending blocks
  if (pendingBlocksQueue.length > 0) {
    const nextBlockTime = pendingBlocksQueue[0].timestamp
    const timeToWait = Math.max(nextBlockTime + CONFIG.blockIndexing.cycleDurationInSeconds * 1000 - currentTime, 1000) // At least wait 1 second
    setTimeout(processPendingBlocks, timeToWait)
  }
}

export const forwardBlockData = async (blockData: any): Promise<void> => {
  const blockTimestamp = parseInt(blockData.header.timestamp, 16) * 1000 // Convert hex timestamp to milliseconds
  const currentTime = Date.now()
  const oneCycleDurationAgo = currentTime - CONFIG.blockIndexing.cycleDurationInSeconds * 1000 // 60 seconds * 1000 ms

  if (blockTimestamp <= oneCycleDurationAgo) {
    // Block is already a minute old, emit immediately
    for (const socket of registeredLogServers.values()) {
      socket.emit(BlockDataWsEvent, StringUtils.safeStringify(blockData))
    }
    /* prettier-ignore */ if (CONFIG.verbose) console.log(`Forwarded block data to ${registeredLogServers.size} LogServers`);
  } else {
    // Add to pending queue
    pendingBlocksQueue.push({ blockData, timestamp: blockTimestamp })
    pendingBlocksQueue.sort((a, b) => a.timestamp - b.timestamp) // Ensure queue is sorted by timestamp

    /* prettier-ignore */ if (CONFIG.verbose) console.log(`Queued block data: block timestamp ${new Date(blockTimestamp).toISOString()} is less than a minute old`);

    // If this is the first block in the queue, start the processing timer
    if (pendingBlocksQueue.length === 1) {
      const timeToWait = Math.max(
        blockTimestamp + CONFIG.blockIndexing.cycleDurationInSeconds * 1000 - currentTime,
        1000
      ) // At least wait 1 second
      setTimeout(processPendingBlocks, timeToWait)
    }
  }
}
