import { SocketStream } from '@fastify/websocket'
import { LogFilterOptions } from './CollectorDataParser'

interface LogSubscription {
  subscriptionId: string
  socketId: string
  filterOptions: LogFilterOptions
}

const logSocketClient = new Map<string, SocketStream>()

export const addLogSocketClient = (socketId: string, socket: SocketStream): void => {
  logSocketClient.set(socketId, socket)
}

export const getLogSocketClient = (socketId: string): SocketStream | undefined => {
  return logSocketClient.get(socketId)
}

export const removeLogSocketClient = (socketId: string): void => {
  logSocketClient.delete(socketId)
}

export const logSubscriptionMap = new Map<string, LogSubscription>()

export const addLogSubscriptions = (
  subscriptionId: string,
  socketId: string,
  filterOptions: LogFilterOptions
): void => {
  logSubscriptionMap.set(subscriptionId, {
    subscriptionId,
    socketId,
    filterOptions,
  })
}

export const removeLogSubscription = (subscriptionId: string): void => {
  logSubscriptionMap.delete(subscriptionId)
}

export const removeLogSubscriptionBySocketId = (socketId: string): void => {
  removeLogSocketClient(socketId)
  logSubscriptionMap.forEach((subscription) => {
    if (subscription.socketId === socketId) {
      logSubscriptionMap.delete(subscription.subscriptionId)
    }
  })
}
