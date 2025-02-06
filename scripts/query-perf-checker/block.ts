import * as crypto from '@shardus/crypto-utils'
import * as Storage from '../../src/storage'
import * as Block from '../../src/storage/block'
import { Utils as StringUtils } from '@shardus/types'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')
crypto.setCustomStringifier(StringUtils.safeStringify, 'shardus_safeStringify')

let start_time
let end_time

const start = async (): Promise<void> => {
  Storage.initializeDB()
  Storage.addExitListeners()

  start_time = process.hrtime()
  await Block.queryBlockByTag('latest')
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Block.queryBlockByTag('earliest')
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Block.queryBlockByNumber(614228)
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Block.queryBlockByHash('0xa40fef5c56bcebce34d77ca18f2cfd274afb10f41a5f5f054f5ce5f17af2319a')
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)
  await Storage.closeDatabase()
}

start()
