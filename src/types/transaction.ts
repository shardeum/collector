import { WrappedEVMAccount, Token } from './account'

export interface Transaction {
  txId: string
  cycle: number
  blockNumber: number
  blockHash: string
  timestamp: number
  wrappedEVMAccount: WrappedEVMAccount
  transactionType: TransactionType
  txHash: string
  txFrom: string
  txTo: string
  nominee?: string
  originalTxData: unknown
  tokenTxs?: TokenTx[]
  txStatus?: TxStatus
  data?: unknown
  internalTXType?: InternalTXType
}

export type TxStatus = 'Pending' | 'Expired'

export enum TransactionType {
  Receipt = 0, // EVM Receipt
  NodeRewardReceipt = 1,
  StakeReceipt = 2,
  UnstakeReceipt = 3,
  InternalTxReceipt = 4,
}

export interface ContractInfo {
  totalSupply: number
  decimals: string
  name: string
  symbol: string
}

export interface TokenTx {
  cycle: number
  timestamp: number
  contractAddress: string
  contractInfo?: ContractInfo
  tokenFrom: string
  tokenTo: string
  tokenValue: string
  tokenType: TokenType
  tokenEvent: string
  tokenOperator?: string | null
  transactionFee: string

  // references another tx
  txId?: string
  txHash: string
}

export enum TokenType {
  EVM_Internal = 0,
  ERC_20 = 1,
  ERC_721 = 2,
  ERC_1155 = 3,
}

export enum InternalTXType {
  SetGlobalCodeBytes = 0,
  InitNetwork = 1,
  NodeReward = 2,
  ChangeConfig = 3,
  ApplyChangeConfig = 4,
  SetCertTime = 5,
  Stake = 6,
  Unstake = 7,
  InitRewardTimes = 8,
  ClaimReward = 9,
  ChangeNetworkParam = 10,
  ApplyNetworkParam = 11,
  Penalty = 12,
  TransferFromSecureAccount = 13,
}

/**
 * InternalTx is a non EVM TX that shardeum can use for utility task such as global changes
 *
 */
export interface InternalTxBase {
  isInternalTx: boolean
  internalTXType: InternalTXType
}

export interface InternalTx extends InternalTxBase {
  timestamp: number
  from?: string
  to?: string
  accountData?: WrappedEVMAccount
  network?: string // Network Account
  nodeId?: string // Node Account
}

export interface DecodeTxResult {
  txs: TokenTx[]
  accs: string[] // ethAddress[]
  tokens: Token[]
}

export enum TransactionSearchType {
  All = 0, // Receipt + NodeRewardReceipt + StakeReceipt + UnstakeReceipt + InternalTxReceipt
  Receipt = 1,
  NodeRewardReceipt = 2,
  StakeReceipt = 3,
  UnstakeReceipt = 4,
  EVM_Internal = 5,
  ERC_20 = 6,
  ERC_721 = 7,
  ERC_1155 = 8,
  TokenTransfer = 9, // token txs of a contract
  InternalTxReceipt = 10,
  AllExceptInternalTx = 11, // Receipt + NodeRewardReceipt + StakeReceipt + UnstakeReceipt (exclude InternalTxReceipt)
  Pending = 12, // Pending Txs (AllExceptInternalTx) from originTxsData
  InitNetwork = 13,         // ----
  NodeReward = 14,          //    |
  ChangeConfig = 15,        //    |
  ApplyChangeConfig = 16,   //    |
  SetCertTime = 17,         //    |
  Stake = 18,               //    | --> INTERNAL TRANSACTION TYPES
  Unstake = 19,             //    |
  InitRewardTimes = 20,     //    |
  ClaimReward = 21,         //    |
  ChangeNetworkParam = 22,  //    |
  ApplyNetworkParam = 23,   //    |
  Penalty = 24,             // ----    
  TransferFromSecureAccount = 25, // ----
}

export interface Log {
  address: string
  blockHash: string
  blockNumber: string
  data: string
  logIndex: string
  topics: string[]
  transactionHash: string
  transactionIndex: string
}
