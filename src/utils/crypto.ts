import * as core from '@shardeum-foundation/lib-crypto-utils'
import { SignedObject } from '@shardeum-foundation/lib-crypto-utils'
import { Utils as StringUtils } from '@shardeum-foundation/lib-types'

import { config as COLLECTOR_CONFIG } from '../config'

// Crypto initialization fns

export function setCryptoHashKey(hashkey: string): void {
  core.init(hashkey)
  core.setCustomStringifier(StringUtils.safeStringify, 'shardus_safeStringify')
}

export const hashObj = core.hashObj


// Asymmetric Encyption Sign/Verify API
export type SignedMessage = SignedObject

export function sign<T>(obj: T): T & SignedObject {
  const objCopy = StringUtils.safeJsonParse(StringUtils.safeStringify(obj))
  core.signObj(objCopy, COLLECTOR_CONFIG.collectorInfo.secretKey, COLLECTOR_CONFIG.collectorInfo.publicKey)
  return objCopy
}

export function verify(obj: SignedObject): boolean {
  return core.verifyObj(obj)
}
