import { FastifyPluginCallback } from 'fastify'
import { checkDatabaseHealth } from '../storage/sqlite3storage'
import { config } from '../config'
import RMQConsumer from '../messaging/rabbitmq/consumer'

const queuesToCheck: Array<RMQConsumer> = []

export function addQueueToCheck(queue: RMQConsumer): void {
  queuesToCheck.push(queue)
}

function isQueueStuck(queue: RMQConsumer): boolean {
  if (!queue.lastMessageTimestamp) {
    return false // No messages have been processed yet
  }
  const now = Date.now()
  const STUCK_THRESHOLD = 60_000 * 5
  return now - queue.lastMessageTimestamp > STUCK_THRESHOLD
}

export const healthCheckRouter: FastifyPluginCallback = function (fastify, opts, done) {
  fastify.get('/is-alive', (req, res) => {
    return res.status(200).send('OK')
  })

  fastify.get('/is-healthy', (req, res) => {
    const defaultDbHealthy = checkDatabaseHealth()
    let shardeumIndexerDbHealthy
    if (config.enableShardeumIndexer) {
      shardeumIndexerDbHealthy = checkDatabaseHealth('shardeumIndexer')
    }

    let overallStatus = defaultDbHealthy && (!config.enableShardeumIndexer || shardeumIndexerDbHealthy)

    const stuckResult = queuesToCheck
      .map((queue) => {
        const isStuck = isQueueStuck(queue)
        if (isStuck) {
          overallStatus = false
        }
        return { queue, isStuck }
      })
      .reduce((acc, { queue, isStuck }) => {
        acc[queue.name] = isStuck ? 'stuck' : 'healthy'
        return acc
      }, {})

    const result = {
      status: overallStatus ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: defaultDbHealthy,
      shardeumIndexerDb: shardeumIndexerDbHealthy,
      ...stuckResult,
    }

    // fastify automatically converts 500 body if not explicitly set like this
    res.header('Content-Type', 'application/json')
    return res.status(overallStatus ? 200 : 500).send(result)
  })

  done()
}
