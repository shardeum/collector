import * as amqp from 'amqplib'
import { addQueueToCheck } from '../../routes/healthCheck'
import { config } from '../../config'
import { sleep } from '../../utils'

export default class RMQConsumer {
  name: string // can be used as identifier
  queue: string
  prefetch: number
  processFn: (msg: string) => Promise<boolean>

  conn: amqp.Connection | null = null
  channel: amqp.Channel | null = null
  isConnected: boolean
  isConnClosing: boolean
  isReconnecting: boolean
  lastMessageTimestamp: number | null = null

  constructor(name: string, queue: string, prefetch = 10, callback: (msg: string) => Promise<boolean>) {
    this.name = name
    this.queue = queue
    this.prefetch = prefetch
    this.isConnected = false
    this.isConnClosing = false
    this.isReconnecting = false
    this.processFn = callback
    addQueueToCheck(this)
  }

  public async consume(): Promise<void> {
    try {
      if (!this.isConnected || this.conn === null) {
        this.conn = await this.connect()
        this.isConnected = true
      }

      // Remove previous event listeners to prevent duplicates
      this.conn.removeAllListeners('error')
      this.conn.removeAllListeners('close')

      this.conn.on('error', this.handleConnectionError)
      this.conn.on('close', this.handleConnectionClose)

      this.channel = await this.conn.createChannel()
      this.channel.prefetch(this.prefetch)

      console.log(`[Consumer ${this.name}]: Started listening to queue: ${this.queue}`)
      let count = 0
      let successCount = 0
      let failedCount = 0

      this.channel.consume(this.queue, async (msg) => {
        if (!msg) return

        count++
        if (config.verbose) console.log(`[Consumer ${this.name}]: Received message`)
        try {
          const success = await this.processFn(msg.content.toString())
          if (success === true) {
            successCount++
            this.lastMessageTimestamp = Date.now() // Update timestamp when processing succeeds
            this.channel!.ack(msg)
            if (config.verbose) console.log(`[Consumer ${this.name}]: Successfully processed message`)
          } else {
            failedCount++
            this.channel!.nack(msg, false, true)
          }
        } catch (e) {
          failedCount++
          let errMsg = `Consumer [${this.name}]: Error while processing message: ${e}`
          if (config.verbose) errMsg += `\nMessage: ${msg.content.toString()}`
          console.error(errMsg)
          this.channel!.nack(msg, false, true)
        }

        if (count > 0 && count % 200 == 0) {
          count = 0
          console.log(
            `[Consumer ${this.name}]: Processing Metrics: Processed Successfully: ${successCount} | Processing Failed: ${failedCount}`
          )
        }
      })
    } catch (e) {
      console.error(`[Consumer ${this.name}]: Unexpected error occurred, retrying connection. Err: ${e}`)
      throw e
    }
  }

  private async connect(): Promise<amqp.Connection> {
    return await amqp.connect({
      protocol: process.env.RMQ_PROTOCOL || 'amqp',
      hostname: process.env.RMQ_HOST,
      port: process.env.RMQ_PORT ? parseInt(process.env.RMQ_PORT) : 5672,
      username: process.env.RMQ_USER,
      password: process.env.RMQ_PASS,
    })
  }

  public async cleanUp(isConnClosing = false): Promise<void> {
    this.isConnClosing = isConnClosing

    try {
      // Check if channel exists and is still open
      if (this.channel?.connection) {
        try {
          console.log(`[Consumer ${this.name}]: Nacking all...`)
          await Promise.race([
            this.channel.nackAll(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('nackAll timeout')), 10000)),
          ])
        } catch (error) {
          console.warn(`[Consumer ${this.name}]: Error or timeout in nackAll - ${error}`)
        }

        try {
          console.log(`[Consumer ${this.name}]: Closing channel...`)
          await Promise.race([
            this.channel.close(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('channel close timeout')), 10000)),
          ])
          console.log(`[Consumer ${this.name}]: Closed channel successfully.`)
        } catch (error) {
          console.warn(`[Consumer ${this.name}]: Error or timeout closing channel - ${error}`)
        }
      }

      // Force clear the channel reference
      this.channel = null

      // Check if connection exists
      if (this.conn) {
        try {
          console.log(`[Consumer ${this.name}]: Closing connection...`)
          await Promise.race([
            this.conn.close(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('connection close timeout')), 10000)
            ),
          ])
          console.log(`[Consumer ${this.name}]: Closed connection successfully.`)
        } catch (error) {
          console.warn(`[Consumer ${this.name}]: Error or timeout closing connection - ${error}`)
        }
      }

      // Force clear the connection reference
      this.conn = null
      this.isConnected = false
    } catch (error) {
      console.error(`[Consumer ${this.name}]: Error in cleanup - ${error}`)
    }
  }

  private handleConnectionError = async (error: unknown): Promise<void> => {
    console.error(`[Consumer ${this.name}]: Connection error: ${error}`)
    this.isConnected = false

    await this.retryConnection()
  }

  private handleConnectionClose = async (): Promise<void> => {
    if (this.isConnClosing === true) {
      // this is triggered internally, possibly on SIGTERM/SIGINT; so no need to retry
      return Promise.resolve()
    }

    this.isConnected = false
    await this.retryConnection()
  }

  private async retryConnection(): Promise<void> {
    if (this.isReconnecting) {
      console.warn(`[retryConnection ${this.name}]: Connection retry already in progress...`)
      return
    }

    this.isReconnecting = true
    let attempt = 0

    try {
      // cleanup the connections before retrying
      await this.cleanUp()
    } catch (e) {
      console.error(`[retryConnection ${this.name}]: error in cleanup: `, e)
    }

    while (!this.isConnected) {
      attempt++
      console.log(`[retryConnection ${this.name}]: (Attempt ${attempt}) initiated connection retry...`)
      try {
        await this.consume()
        console.log(`[retryConnection ${this.name}]: (Attempt ${attempt}) successfully connected...`)
        this.isConnected = true
        break
      } catch (e) {
        console.log(`[retryConnection ${this.name}]: (Attempt ${attempt}) unsuccessful. Err: ${e}`)
      }

      console.log(`[retryConnection ${this.name}]: (Attempt ${attempt}) waiting for 5s before retrying...`)
      await sleep(5000) // Wait 5 seconds before retrying
    }
    this.isReconnecting = false
  }
}
