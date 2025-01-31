import { FastifyPluginCallback } from 'fastify'
import { checkDatabaseHealth } from '../storage/sqlite3storage'
import { config } from '../config'

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

    const overallStatus = defaultDbHealthy && (!config.enableShardeumIndexer || shardeumIndexerDbHealthy)
    const result = {
      status: overallStatus ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: defaultDbHealthy,
      shardeumIndexerDb: shardeumIndexerDbHealthy,
    }

    // fastify automatically converts 500 body if not explicitly set like this
    res.header('Content-Type', 'application/json')
    return res.status(overallStatus ? 200 : 500).send(result)
  })

  done()
}
