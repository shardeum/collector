import { Receipt, WrappedAccount, Log } from '../types'

export const extractLogsFromReceipts = (receipts: Receipt[]): Log[] => {
  const parsedReceipts = typeof receipts === 'string' ? JSON.parse(receipts) : receipts
  const readableReceipts: WrappedAccount[] = parsedReceipts.map((receipt) => receipt.appReceiptData).flat()

  // extract logs from readableReceipts
  const logs = readableReceipts
    .map((receipt) => {
      if ('readableReceipt' in receipt.data && receipt.data.readableReceipt?.logs)
        return receipt.data.readableReceipt.logs
    })
    .flat()
    .filter((log) => {
      if (log === undefined) return false
      if ('address' in log && 'topics' in log && 'data' in log) return true
    })

  return logs
}

export interface LogFilterOptions {
  address: string[]
  topics: string[]
}

export class IndexedLogs {
  LogMap: Map<string, Log> // Map of log ID to log
  AddressMap: Map<string, string[]> // Map of contract address to logs
  Topic0Map: Map<string, string[]> // Map of topic0 to logs
  Topic1Map: Map<string, string[]> // Map of topic1 to logs
  Topic2Map: Map<string, string[]> // Map of topic2 to logs
  Topic3Map: Map<string, string[]> // Map of topic3 to logs

  constructor(logs: Log[]) {
    this.LogMap = new Map<string, Log>()
    this.AddressMap = new Map<string, string[]>()
    this.Topic0Map = new Map<string, string[]>()
    this.Topic1Map = new Map<string, string[]>()
    this.Topic2Map = new Map<string, string[]>()
    this.Topic3Map = new Map<string, string[]>()

    for (let i = 0; i < logs.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const log = logs[i]
      const logId = i.toString()
      this.LogMap.set(logId, log)

      const address = log.address.toLowerCase()
      const topics = log.topics.map((topic) => topic.toLowerCase())

      if (!this.AddressMap.has(address)) {
        this.AddressMap.set(address, [])
      }
      this.AddressMap.get(address).push(logId)
      if (!this.Topic0Map.has(topics[0])) {
        this.Topic0Map.set(topics[0], [])
      }
      this.Topic0Map.get(topics[0]).push(logId)
      if (!this.Topic1Map.has(topics[1])) {
        this.Topic1Map.set(topics[1], [])
      }
      this.Topic1Map.get(topics[1]).push(logId)
      if (!this.Topic2Map.has(topics[2])) {
        this.Topic2Map.set(topics[2], [])
      }
      this.Topic2Map.get(topics[2]).push(logId)
      if (!this.Topic3Map.has(topics[3])) {
        this.Topic3Map.set(topics[3], [])
      }
      this.Topic3Map.get(topics[3]).push(logId)
    }
  }

  filter(options: LogFilterOptions): Log[] {
    let topicFilterMatch: string[] = []
    const addressFilterMatch: string[] = []

    if (options.address) {
      for (const address of options.address) {
        addressFilterMatch.push(...(this.AddressMap.get(address) || []))
      }
    }

    if (options.topics) {
      if (options.topics.length == 1) {
        topicFilterMatch = [...(this.Topic0Map.get(options.topics[0]) || [])]
      } else if (options.topics.length == 2) {
        const topic0FilterMatch = new Set(this.Topic0Map.get(options.topics[0]) || [])
        const topic1FilterMatch = new Set(this.Topic1Map.get(options.topics[1]) || [])
        topicFilterMatch = intersectionOfSets([topic0FilterMatch, topic1FilterMatch])
      } else if (options.topics.length == 3) {
        const topic0FilterMatch = new Set(this.Topic0Map.get(options.topics[0]) || [])
        const topic1FilterMatch = new Set(this.Topic1Map.get(options.topics[1]) || [])
        const topic2FilterMatch = new Set(this.Topic2Map.get(options.topics[2]) || [])
        topicFilterMatch = intersectionOfSets([topic0FilterMatch, topic1FilterMatch, topic2FilterMatch])
      } else if (options.topics.length == 4) {
        const topic0FilterMatch = new Set(this.Topic0Map.get(options.topics[0]) || [])
        const topic1FilterMatch = new Set(this.Topic1Map.get(options.topics[1]) || [])
        const topic2FilterMatch = new Set(this.Topic2Map.get(options.topics[2]) || [])
        const topic3FilterMatch = new Set(this.Topic2Map.get(options.topics[3]) || [])
        topicFilterMatch = intersectionOfSets([
          topic0FilterMatch,
          topic1FilterMatch,
          topic2FilterMatch,
          topic3FilterMatch,
        ])
      }
    }

    // remove duplicate logIds
    let result = []
    if (options.address.length === 0) {
      result = [...new Set(topicFilterMatch)]
    } else if (options.topics.length === 0) {
      result = [...new Set(addressFilterMatch)]
    } else {
      result = [...new Set(intersectionOfSets([new Set(addressFilterMatch), new Set(topicFilterMatch)]))]
    }
    // sort the logIds
    result.sort((a, b) => parseInt(a) - parseInt(b))

    return result.map((logId) => this.LogMap.get(logId) as Log)
  }
}

const intersectionOfSets = <T>(sets: Set<T>[]): T[] => {
  if (sets.length === 0) {
    return []
  }

  // Sort the array by set size
  sets.sort((a, b) => a.size - b.size)

  // Start with the smallest set, and check for intersection with the other sets
  return [...sets[0]].filter((x) => sets.every((set) => set.has(x)))
}
