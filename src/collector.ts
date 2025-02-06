import * as dotenv from 'dotenv'
dotenv.config()
import WebSocket from 'ws'
import { Utils as StringUtils } from '@shardus/types'
import * as Storage from './storage'
import * as Crypto from './utils/crypto'
import * as cycle from './storage/cycle'
import * as receipt from './storage/receipt'
import * as transaction from './storage/transaction'
import * as originalTxData from './storage/originalTxData'
import * as checkpoint from './storage/checkpoint'
import {
  downloadTxsDataAndCycles,
  compareWithOldReceiptsData,
  compareWithOldCyclesData,
  downloadAndSyncGenesisAccounts,
  needSyncing,
  toggleNeedSyncing,
  downloadReceiptsBetweenCycles,
  compareWithOldOriginalTxsData,
  downloadOriginalTxsDataBetweenCycles,
  queryFromDistributor,
  DataType,
} from './class/DataSync'
import { validateData } from './class/validateData'
import { DistributorSocketCloseCodes } from './types'
import { initDataLogWriter } from './class/DataLogWriter'
import { setupCollectorSocketServer } from './log_subscription/CollectorSocketconnection'
// config variables
import {
  config as CONFIG,
  DISTRIBUTOR_URL,
  collectorMode,
  config,
  envEnum,
  overrideDefaultConfig,
} from './config'
import { sleep } from './utils'
import RMQCyclesConsumer from './collectors/rmq_cycles'
import RMQOriginalTxsConsumer from './collectors/rmq_original_txs'
import RMQReceiptsConsumer from './collectors/rmq_receipts'
import * as db from './storage/sqlite3storage'
import { CycleDataCache } from './class/CycleDataCache'

const DistributorFirehoseEvent = 'FIREHOSE'
let ws: WebSocket
let reconnecting = false
let connected = false

const env = process.env
const args = process.argv

import path = require('path')
import fs = require('fs')
import Fastify from 'fastify'
import fastifyRateLimit from '@fastify/rate-limit'
import { healthCheckRouter } from './routes/healthCheck'
import { startPatching } from './utils/patchCollector'

if (config.env == envEnum.DEV) {
  //default debug mode keys
  //  pragma: allowlist nextline secret
  config.USAGE_ENDPOINTS_KEY = 'ceba96f6eafd2ea59e68a0b0d754a939'
  config.collectorInfo.secretKey =
    //  pragma: allowlist nextline secret
    '7d8819b6fac8ba2fbac7363aaeb5c517e52e615f95e1a161d635521d5e4969739426b64e675cad739d69526bf7e27f3f304a8a03dca508a9180f01e9269ce447'
  config.collectorInfo.publicKey =
    // pragma: allowlist nextline secret
    '9426b64e675cad739d69526bf7e27f3f304a8a03dca508a9180f01e9269ce447'
  config.distributorInfo.publicKey =
    // pragma: allowlist nextline secret
    '758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3'
} else {
  // Pull in secrets
  const secretsPath = path.join(__dirname, '../.secrets')
  const secrets = {}

  if (fs.existsSync(secretsPath)) {
    const lines = fs.readFileSync(secretsPath, 'utf-8').split('\n').filter(Boolean)

    lines.forEach((line) => {
      const [key, value] = line.split('=')
      secrets[key.trim()] = value.trim()
    })
  }
  if (secrets['USAGE_ENDPOINTS_KEY']) {
    config.USAGE_ENDPOINTS_KEY = secrets['USAGE_ENDPOINTS_KEY']
  }
  if (secrets['COLLECTOR_SECRET_KEY']) {
    config.collectorInfo.secretKey = secrets['COLLECTOR_SECRET_KEY']
  }
  if (secrets['COLLECTOR_PUBLIC_KEY']) {
    config.collectorInfo.publicKey = secrets['COLLECTOR_PUBLIC_KEY']
  }
  if (secrets['DISTRIBUTOR_PUBLIC_KEY']) {
    config.distributorInfo.publicKey = secrets['DISTRIBUTOR_PUBLIC_KEY']
  }
}

let rmqCyclesConsumer: RMQCyclesConsumer
let rmqTransactionsConsumer: RMQOriginalTxsConsumer
let rmqReceiptsConsumer: RMQReceiptsConsumer

async function startHttpServer() {
  if (!CONFIG.enableCollectorSocketServer) {
    const server = Fastify({
      logger: false,
    })

    await server.register(fastifyRateLimit, {
      max: config.rateLimit,
      timeWindow: '1 minute',
      allowList: ['127.0.0.1', 'localhost'],
    })
    server.setErrorHandler((error, request, reply) => {
      server.log.error(`Error processing request ${request.id}. Error ${error}`)
      reply.send({ error: error.message })
    })
    await server.register(healthCheckRouter)
    server.listen(
      {
        port: Number(CONFIG.port.collector),
        host: '0.0.0.0',
      },
      async (err) => {
        if (err) {
          server.log.error('Collector: ' + err)
          console.log('Collector: ' + err)
          throw err
        }
        console.log('Collector is listening on port:', CONFIG.port.collector)
      }
    )
  }
}

export const initialSync = async (): Promise<void> => {
  console.log(`Collector Mode: ${CONFIG.collectorMode}`)

  // Check if there is any existing data in the db
  let lastStoredReceiptCount = await receipt.queryReceiptCount()
  let lastStoredOriginalTxDataCount = await originalTxData.queryOriginalTxDataCount()
  let lastStoredCycleCount = await cycle.queryCycleCount()
  let lastStoredCycle = (await cycle.queryLatestCycleRecords(1))[0]

  if (lastStoredCycleCount > 0 && lastStoredCycle.counter !== lastStoredCycleCount - 1) {
    console.log(
      'lastStoredCycleCount',
      lastStoredCycleCount,
      'lastStoredCycleCounter',
      lastStoredCycle.counter
    )
    // Check if the last stored cycle counter is correct
    throw Error(
      'The last stored cycle counter does not match with the last stored cycle count! Patch the missing cycle data and start the server again!'
    )
  }
  let totalReceiptsToSync = 0
  let totalCyclesToSync = 0
  let totalOriginalTxsToSync = 0
  let lastStoredReceiptCycle = 0
  let lastStoredOriginalTxDataCycle = 0
  let response = await queryFromDistributor(DataType.TOTALDATA, {})
  if (
    response.data &&
    response.data.totalReceipts >= 0 &&
    response.data.totalCycles >= 0 &&
    response.data.totalOriginalTxs >= 0
  ) {
    totalReceiptsToSync = response.data.totalReceipts
    totalCyclesToSync = response.data.totalCycles
    totalOriginalTxsToSync = response.data.totalOriginalTxs
    console.log(
      'totalReceiptsToSync',
      totalReceiptsToSync,
      'totalCyclesToSync',
      totalCyclesToSync,
      'totalOriginalTxsToSync',
      totalOriginalTxsToSync
    )
  }
  console.log(
    'lastStoredReceiptCount',
    lastStoredReceiptCount,
    'lastStoredCycleCount',
    lastStoredCycleCount,
    'lastStoredOriginalTxDataCount',
    lastStoredOriginalTxDataCount
  )
  // Make sure the data that saved are authentic by comparing receipts count of last 10 cycles for receipts data, originalTxs count of last 10 cycles for originalTxData data and 10 last cycles for cycles data
  if (lastStoredReceiptCount > 0) {
    const lastStoredReceiptInfo = await receipt.queryLatestReceipts(1)
    if (lastStoredReceiptInfo && lastStoredReceiptInfo.length > 0)
      lastStoredReceiptCycle = lastStoredReceiptInfo[0].cycle
    const receiptResult = await compareWithOldReceiptsData(lastStoredReceiptCycle)
    if (!receiptResult.success) {
      throw Error(
        'The last saved receipts of last 10 cycles data do not match with the distributor data! Clear the DB and start the server again!'
      )
    }
    lastStoredReceiptCycle = receiptResult.matchedCycle
  }
  if (lastStoredOriginalTxDataCount > 0) {
    const lastStoredOriginalTxDataInfo = await originalTxData.queryOriginalTxsData(1)
    if (lastStoredOriginalTxDataInfo && lastStoredOriginalTxDataInfo.length > 0)
      lastStoredOriginalTxDataCycle = lastStoredOriginalTxDataInfo[0].cycle
    const originalTxResult = await compareWithOldOriginalTxsData(lastStoredOriginalTxDataCycle)
    if (!originalTxResult.success) {
      throw Error(
        'The last saved originalTxsData of last 10 cycles data do not match with the distributor data! Clear the DB and start the server again!'
      )
    }
    lastStoredOriginalTxDataCycle = originalTxResult.matchedCycle
  }
  if (totalCyclesToSync > lastStoredCycleCount && lastStoredCycleCount > 10) {
    const cycleResult = await compareWithOldCyclesData(lastStoredCycleCount)
    if (!cycleResult.success) {
      throw Error(
        'The last saved 10 cycles data does not match with the distributor data! Clear the DB and start the server again!'
      )
    }

    lastStoredCycleCount = cycleResult.cycle
  }
  if (lastStoredReceiptCount > 0 || lastStoredOriginalTxDataCount > 0) {
    if (lastStoredReceiptCount > totalReceiptsToSync) {
      throw Error(
        'The existing db has more receipts data than the network data! Clear the DB and start the server again!'
      )
    }
    if (lastStoredOriginalTxDataCount > totalOriginalTxsToSync) {
      throw Error(
        'The existing db has more originalTxsData data than the network data! Clear the DB and start the server again!'
      )
    }
  }

  // If there is already some data in the db, we can assume that the genesis accounts data has been synced already
  if (lastStoredCycleCount === 0) await downloadAndSyncGenesisAccounts() // To sync accounts data that are from genesis accounts/accounts data that the network start with

  // Refresh the total data to sync after collector connected to distributor
  response = await queryFromDistributor(DataType.TOTALDATA, {})
  if (
    response.data &&
    response.data.totalReceipts >= 0 &&
    response.data.totalCycles >= 0 &&
    response.data.totalOriginalTxs >= 0
  ) {
    totalReceiptsToSync = response.data.totalReceipts
    totalCyclesToSync = response.data.totalCycles
    totalOriginalTxsToSync = response.data.totalOriginalTxs
    console.log(
      'totalReceiptsToSync',
      totalReceiptsToSync,
      'totalCyclesToSync',
      totalCyclesToSync,
      'totalOriginalTxsToSync',
      totalOriginalTxsToSync
    )
  }
  if (totalReceiptsToSync > lastStoredReceiptCount) toggleNeedSyncing()
  if (!needSyncing && totalOriginalTxsToSync > lastStoredOriginalTxDataCount) toggleNeedSyncing()
  if (!needSyncing && totalCyclesToSync > lastStoredCycleCount) toggleNeedSyncing()
  if (!needSyncing) return
  console.log(
    lastStoredReceiptCount,
    totalReceiptsToSync,
    lastStoredCycleCount,
    totalCyclesToSync,
    lastStoredOriginalTxDataCount,
    totalOriginalTxsToSync
  )
  // Sync receipts and originalTxsData data first if there is old data
  if (
    lastStoredReceiptCycle > 0 &&
    totalCyclesToSync > lastStoredReceiptCycle &&
    totalReceiptsToSync > lastStoredReceiptCount
  ) {
    await downloadReceiptsBetweenCycles(lastStoredReceiptCycle, totalCyclesToSync)
    lastStoredReceiptCount = await receipt.queryReceiptCount()
  }
  if (
    lastStoredOriginalTxDataCycle > 0 &&
    totalCyclesToSync > lastStoredOriginalTxDataCycle &&
    totalOriginalTxsToSync > lastStoredOriginalTxDataCount
  ) {
    await downloadOriginalTxsDataBetweenCycles(lastStoredOriginalTxDataCycle, totalCyclesToSync)
    lastStoredOriginalTxDataCount = await originalTxData.queryOriginalTxDataCount()
  }
  await downloadTxsDataAndCycles(
    totalReceiptsToSync,
    lastStoredReceiptCount,
    totalOriginalTxsToSync,
    lastStoredOriginalTxDataCount,
    totalCyclesToSync,
    lastStoredCycleCount
  )
  toggleNeedSyncing()
}

const attemptReconnection = (): void => {
  console.log(`Re-connecting Distributor in ${CONFIG.RECONNECT_INTERVAL_MS / 1000}s...`)
  reconnecting = true
  setTimeout(connectToDistributor, CONFIG.RECONNECT_INTERVAL_MS)
}

const connectToDistributor = (): void => {
  const collectorInfo = {
    subscriptionType: DistributorFirehoseEvent,
    timestamp: Date.now(),
  }
  const queryString = encodeURIComponent(
    StringUtils.safeStringify(Crypto.sign({ collectorInfo, sender: CONFIG.collectorInfo.publicKey }))
  )
  const URL = `${DISTRIBUTOR_URL}?data=${queryString}`
  ws = new WebSocket(URL)
  ws.onopen = () => {
    console.log(
      `✅ Socket connected to the Distributor @ ${CONFIG.distributorInfo.ip}:${CONFIG.distributorInfo.port}}`
    )
    connected = true
    reconnecting = false
  }

  // Listening to messages from the server (child process)
  ws.on('message', (data: string) => {
    try {
      validateData(StringUtils.safeJsonParse(data))
    } catch (e) {
      console.log('Error in processing received data!', e)
    }
  })
  ws.onerror = (error) => {
    console.error('Distributor WebSocket error:', error.message)
    reconnecting = false
  }

  // Listening to Socket termination event from the Distributor
  ws.onclose = (closeEvent: WebSocket.CloseEvent) => {
    console.log('❌ Connection with Server Terminated!.')
    switch (closeEvent.code) {
      case DistributorSocketCloseCodes.DUPLICATE_CONNECTION_CODE:
        console.log(
          '❌ Socket Connection w/ same client credentials attempted. Dropping existing connection.'
        )
        break
      case DistributorSocketCloseCodes.SUBSCRIBER_EXPIRATION_CODE:
        console.log('❌ Subscription Validity Expired. Connection Terminated.')
        break
      default:
        console.log(`❌ Socket Connection w/ Distributor Terminated with code: ${closeEvent.code}`)
        reconnecting = false
        break
    }
    if (!reconnecting) attemptReconnection()
  }
}

// start queue consumers for cycles, transactions and receipts events
const startRMQEventsConsumers = (): void => {
  rmqCyclesConsumer = new RMQCyclesConsumer()
  rmqTransactionsConsumer = new RMQOriginalTxsConsumer()
  rmqReceiptsConsumer = new RMQReceiptsConsumer()

  rmqCyclesConsumer.start()
  rmqTransactionsConsumer.start()
  rmqReceiptsConsumer.start()

  // add signal listeners
  process.on('SIGTERM', async () => {
    await stopRMQEventsConsumers()
  })
  process.on('SIGINT', async () => {
    await stopRMQEventsConsumers()
  })
}

const stopRMQEventsConsumers = async (): Promise<void> => {
  console.log(`Initiated RabbitMQ connections cleanup`)
  await rmqCyclesConsumer.cleanUp()
  await rmqTransactionsConsumer.cleanUp()
  await rmqReceiptsConsumer.cleanUp()
  console.log(`Completed RabbitMQ connections cleanup`)
}

const addSigListeners = (): void => {
  process.on('SIGUSR1', async () => {
    console.log('DETECTED SIGUSR1 SIGNAL')
    // Reload the config.json
    overrideDefaultConfig(env, args)
    console.log('Config reloaded', CONFIG)
  })
  process.on('SIGINT', async () => {
    console.log('DETECTED SIGINT SIGNAL')
    db.close()
    process.exit(0)
  })
  console.log('Registerd signal listeners.')
}

const startCollector = async () => {
  // Override default configuration with environment variables and arguments
  overrideDefaultConfig(env, args)

  if (!config.collectorInfo.secretKey || !config.collectorInfo.publicKey) {
    console.error('Please provide a keypair in collector config')
    process.exit(1)
  }

  // Set crypto hash keys from config
  Crypto.setCryptoHashKey(CONFIG.hashKey)

  // Initialize the database
  Storage.initializeDB()
  Storage.addExitListeners(ws)

  // Initialize data log writer if enabled
  if (CONFIG.dataLogWrite) await initDataLogWriter()

  // Setup collector socket server if enabled
  if (CONFIG.enableCollectorSocketServer) setupCollectorSocketServer()

  // Add signal listeners
  addSigListeners()

  // Start RabbitMQ event consumers or connect to distributor based on collector mode
  if (CONFIG.collectorMode === collectorMode.MQ) {
    await startHttpServer()
    startRMQEventsConsumers()
  } else {
    const CONNECT_TO_DISTRIBUTOR_MAX_RETRY = 10
    let retry = 0
    while (!connected) {
      connectToDistributor()
      retry++
      await sleep(2000)
      if (!connected && retry > CONNECT_TO_DISTRIBUTOR_MAX_RETRY) {
        throw Error('Cannot connect to the distributor!')
      }
    }
  }

  async function shutdownCollector() {
    // Perform any necessary cleanup here
    db.close() // Close the database connection
    console.log('Collector shut down complete.')
    if (CONFIG.collectorMode === collectorMode.MQ) await stopRMQEventsConsumers()
    process.exit(1) // Restart the process
  }

  const cycleDataCache = new CycleDataCache()

  // Naming Convention:
  // Last - previous checkpoint
  // Current - The checkpoint we're about to add
  // Latest - The most recent cycle available in the DB

  let endPointer = 0
  let lastCheckpoint: number

  console.log(`Starting infinite loop to verify data and update checkpoints`)

  // rolling checkpoint mechanism
  while (true) {
    try {
      // Start verification and checkpointing process here
      // Check if we have cycle number 'checkPointer' in the db, if not, invoke patcher
      lastCheckpoint = await checkpoint.fetchCheckpoint() // last known verified checkpoint
      const nextCheckpoint = lastCheckpoint + 1
      const nextCheckpointData = await cycle.queryCycleByCounter(nextCheckpoint)
      if (!nextCheckpointData) {
        console.error(`Cycle ${nextCheckpoint} is missing from the database.`)
        throw Error('Verification failed')
      }
      while (endPointer < nextCheckpointData.counter + config.checkpointWindow) {
        // this allows us to have a rolling checkpointer
        // Wait till we have 21 cycles of data [ checkpointWindow = 21 ]
        const latestCycle = await cycle.queryLatestCycleRecords(1)
        if (latestCycle[0].counter >= nextCheckpoint + config.checkpointWindow) {
          if (config.verbose) console.log('We have all the cycles we need. Proceeding to verification')
          endPointer = latestCycle[0].counter
          break
        }
        console.log(
          '⏱️ Waiting for more cycles to be available in the database',
          'latestCycle',
          latestCycle[0].counter,
          'endPointer',
          endPointer,
          'checkpointWindow',
          config.checkpointWindow,
          'lastCheckpoint',
          lastCheckpoint
        )
        await sleep(5000)
      }

      if (config.verbose)
        console.log(
          `Time to validate data for checkpoint cycle ${nextCheckpoint}(previous: ${lastCheckpoint})`
        )

      // We should always have the next 11 cycles here. Fetch the data from distributor
      const response = await cycleDataCache.getCycleDataFor(nextCheckpoint)
      if (!response) {
        console.error(`❗ Verification failed for cycle ${nextCheckpoint}. Missing data from distributor.`)
        throw Error('Verification failed')
      }
      // Fetch receipt count for this cycle from our DB
      const ourTotalReceipts = await receipt.queryReceiptCountBetweenCycles(nextCheckpoint, nextCheckpoint)
      if (ourTotalReceipts !== response.receiptCount) {
        console.log(`❗ Verification failed for cycle ${nextCheckpoint}. Mismatching Receipts.`)
        throw Error('Verification failed')
      }
      // Fetch transaction count for this cycle from our DB
      const ourTotalTransactions = await originalTxData.queryOriginalTxDataCount(
        null,
        null,
        nextCheckpoint,
        nextCheckpoint
      )
      if (ourTotalTransactions !== response.transactionCount) {
        console.log(`❗ Verification failed for cycle ${nextCheckpoint}. Mismatching Transactions.`)
        throw Error('Verification failed')
      }

      // Verification successful
      console.log(`🟢 Verification successful. Updating checkpoint to ${nextCheckpoint}`)
      await checkpoint.insertCheckpoint(nextCheckpoint) // rolling checkpoint, moving to next cycle after data verification
    } catch (e) {
      if (e.message === 'Verification failed') {
        console.error(`Identified missing data for cycle: ${lastCheckpoint + 1}`)
        console.log('Attempting fix..')

        // Fetch latest checkpoint
        console.log('The last known checkpoint to patch from is', lastCheckpoint)
        const currentCycle = lastCheckpoint + 1
        // Starts the syncing process
        const status = await startPatching(currentCycle, currentCycle)

        if (!status) {
          console.error('Patching process failed, shutting down the collector process.')
          await shutdownCollector() // Perform graceful shutdown
        }
      } else {
        // Handle other errors
        console.error('An unexpected error occurred:', e) // it goes back into the loop because the error happened due to non patching/crosschecking issue
      }
    }
  }
}

startCollector()
