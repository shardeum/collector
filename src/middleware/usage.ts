import moment from 'moment'
import type { FastifyError, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'

import { config as CONFIG } from '../config'

interface UsageMetrics {
  enabled: boolean
  enabledAt: Date | null
  counter: Record<string, number>
  errorsCounter: Record<string, Record<string, number>>
}

const usageMetrics: UsageMetrics = {
  enabled: false,
  enabledAt: null,
  counter: {},
  errorsCounter: {},
}

const validateSecurityKey = (req: FastifyRequest, reply: FastifyReply): boolean => {
  const securityKey = req.headers['x-usage-key']

  if (CONFIG.USAGE_ENDPOINTS_KEY === securityKey) {
    return true
  }

  reply.code(403)
  reply.send('Unauthorized')
  return false
}

const validUrl = (url: string): boolean => {
  return url.startsWith('/api')
}

const ignoreQueryValues = (url: string): string => {
  if (url.includes('?')) {
    const split_query = url.split('&')
    let final_url = ''
    for (const query of split_query) {
      if (query.includes('=')) {
        if (final_url != '') final_url += '&' + query.substring(0, query.indexOf('='))
        else final_url += query.substring(0, query.indexOf('='))
      }
    }
    return final_url
  }
  return url
}

/**
 * Usage middleware, intercepts requests and counts them by endpoint, only if usage metrics are enabled.
 */
export const usageMiddleware = (req: FastifyRequest, _: FastifyReply, done: HookHandlerDoneFunction): void => {
  if (!usageMetrics.enabled) {
    done()
    return
  }

  let url = req.raw.url
  if (!validUrl(url)) {
    done()
    return
  }
  url = ignoreQueryValues(url)

  /* eslint-disable security/detect-object-injection */
  usageMetrics.counter[url] = (usageMetrics.counter[url] || 0) + 1
  done()
}

/**
 * Usage error middleware, intercepts errors and counts them by endpoint and error message, only if usage metrics are enabled.
 */
export const usageErrorMiddleware = (
  req: FastifyRequest,
  _: FastifyReply,
  error: FastifyError,
  done: HookHandlerDoneFunction
): void => {
  if (!usageMetrics.enabled) {
    done()
    return
  }

  const url = req.raw.url

  /* eslint-disable security/detect-object-injection */
  const endpointErrors = usageMetrics.errorsCounter[url] || {}
  endpointErrors[error.message] = (endpointErrors[error.message] || 0) + 1
  usageMetrics.errorsCounter[url] = endpointErrors
  done()
}

/**
 * Usage enable handler, enables usage metrics and resets the counters.
 */
export const usageEnableHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!validateSecurityKey(req, reply)) {
    return
  }

  if (!usageMetrics.enabled) {
    usageMetrics.enabled = true
    usageMetrics.enabledAt = new Date()
    usageMetrics.counter = {}
    usageMetrics.errorsCounter = {}
  }

  reply.send({
    status: 'enabled',
    enabledAt: usageMetrics.enabledAt,
  })
}

/**
 * Usage disable handler, disables usage metrics and resets the counters.
 */
export const usageDisableHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!validateSecurityKey(req, reply)) {
    return
  }

  usageMetrics.enabled = false
  usageMetrics.enabledAt = null
  usageMetrics.counter = {}
  usageMetrics.errorsCounter = {}

  reply.send({
    status: 'disabled',
  })
}

/**
 * Usage metrics handler, returns the usage metrics.
 */
export const usageMetricsHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!validateSecurityKey(req, reply)) {
    return
  }

  if (!usageMetrics.enabled) {
    reply.send({
      enabled: usageMetrics.enabled,
    })
  }
  reply.send({
    enabled: usageMetrics.enabled,
    enabledAt: usageMetrics.enabledAt,
    enableForInMinutes: moment(new Date()).diff(moment(usageMetrics.enabledAt), 'minutes'),
    usage: usageMetrics.counter,
    errors: usageMetrics.errorsCounter,
  })
}
