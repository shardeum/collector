import * as crypto from '@shardus/crypto-utils'
import * as Storage from '../../src/storage'
import * as Cycle from '../../src/storage/cycle'
import * as Transaction from '../../src/storage/transaction'
import * as Account from '../../src/storage/account'
import * as Block from '../../src/storage/block'
import { TransactionSearchType } from '../../src/types'
import { Utils as StringUtils } from '@shardus/types'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')
crypto.setCustomStringifier(StringUtils.safeStringify, 'shardus_safeStringify')

let start_time
let end_time

const start = async (): Promise<void> => {
  Storage.initializeDB()
  Storage.addExitListeners()

  start_time = process.hrtime()
  await Cycle.queryCycleCount()
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Account.queryAccountCount()
  end_time = process.hrtime(start_time)
  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionByTxId('519a5288caae6ba68770a37332c6769d39845439d66c77e285988abef80ea71c')
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionByHash(
    '0x06155712daeba2dcb25fc4d13e43006e34dac29150f0cc74a240de2103c03e07'
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount()
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(0, 10)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(null, TransactionSearchType.AllExceptInternalTx)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(0, 10, null, TransactionSearchType.AllExceptInternalTx)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(null, TransactionSearchType.StakeReceipt)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(0, 10, null, TransactionSearchType.StakeReceipt)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(null, TransactionSearchType.UnstakeReceipt)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(0, 10, null, TransactionSearchType.UnstakeReceipt)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount('0x41bdc7393d4360e3194c411314a79a71bfa559f2')
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(0, 10, '0x41bdc7393d4360e3194c411314a79a71bfa559f2')
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(
    '0x41bdc7393d4360e3194c411314a79a71bfa559f2',
    TransactionSearchType.AllExceptInternalTx
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactions(
    0,
    10,
    '0xed38ff1efb8207cfdfed75fad5004077819afc3a',
    TransactionSearchType.AllExceptInternalTx
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(
    '0xed38ff1efb8207cfdfed75fad5004077819afc3a',
    TransactionSearchType.StakeReceipt
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(
    '0x41bdc7393d4360e3194c411314a79a71bfa559f2',
    TransactionSearchType.StakeReceipt
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(
    '0xed38ff1efb8207cfdfed75fad5004077819afc3a',
    TransactionSearchType.UnstakeReceipt
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionCount(
    '0x41bdc7393d4360e3194c411314a79a71bfa559f2',
    TransactionSearchType.UnstakeReceipt
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionsByBlock(614520, undefined)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  await Transaction.queryTransactionsByBlock(
    undefined,
    '0x7fb292e81297fd1ca3ea8eb3aeadb895d4b77b3af5b8a28987a2ee1bf27a6d30'
  )
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  start_time = process.hrtime()
  const block = await Block.queryBlockByHash(
    '0x7fb292e81297fd1ca3ea8eb3aeadb895d4b77b3af5b8a28987a2ee1bf27a6d30'
  )
  // console.log(block)
  await Transaction.queryTransactionsByBlock(block.number, undefined)
  end_time = process.hrtime(start_time)

  console.log('End Time', end_time)
  console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)

  //   const promises = [
  //     Cycle.queryCycleCount().then((res) => {
  //       end_time = process.hrtime(start_time)
  //       console.log('End Time', end_time)
  //       console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)
  //     }),
  //     Transaction.queryTransactionCount(null, TransactionSearchType.AllExceptInternalTx).then((res) => {
  //       end_time = process.hrtime(start_time)
  //       console.log('End Time', end_time)
  //       console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)
  //     }),
  //     Transaction.queryTransactionCount(null, TransactionSearchType.StakeReceipt).then((res) => {
  //       end_time = process.hrtime(start_time)
  //       console.log('End Time', end_time)
  //       console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)
  //     }),
  //     Transaction.queryTransactionCount(null, TransactionSearchType.UnstakeReceipt).then((res) => {
  //       end_time = process.hrtime(start_time)
  //       console.log('End Time', end_time)
  //       console.log('Time in millisecond is: ', end_time[0] * 1000 + end_time[1] / 1000000)
  //     }),
  //   ]

  //   start_time = process.hrtime()
  //   Promise.allSettled(promises)
  //     .then((responses) => {
  //       let i = 0
  //       for (const response of responses) {
  //         if (response.status === 'fulfilled') {
  //           // const res = response.value
  //         } else {
  //           console.log(response)
  //         }
  //       }
  //     })
  //     .catch((error) => {
  //       // Handle any errors that occurred
  //       console.error(error)
  //     })

  await Storage.closeDatabase()
}

start()
