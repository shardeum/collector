import { P2P, StateManager } from '@shardeum-foundation/lib-types'

export interface Cycle {
  cycleMarker: StateManager.StateMetaDataTypes.CycleMarker
  counter: number
  cycleRecord: P2P.CycleCreatorTypes.CycleData
}
