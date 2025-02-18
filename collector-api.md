---
title: 'Shardeum Collector API'
---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="collector-api">Shardeum Collector API</h1>

## get__api_account

`GET /api/account`

_Get account information_

<h3 id="get__api_account-parameters">Parameters</h3>

| Name        | In    | Type   | Required | Description                                               |
| ----------- | ----- | ------ | -------- | --------------------------------------------------------- |
| count       | query | string | false    | Number of accounts to retrieve (maximum 1000).            |
| page        | query | stirng | false    | Page number for paginated results.                        |
| address     | query | string | false    | Account address to retrieve.                              |
| type        | query | string | false    | Filter accounts by type.                                  |
| accountType | query | string | false    | Specific account type to filter when querying by address. |
| startCycle  | query | string | false    | Starting cycle number for filtering accounts.             |
| endCycle    | query | string | false    | Ending cycle number for filtering accounts.               |
| accountId   | query | string | false    | Account ID to retrieve (must be 64 characters).           |
| blockNumber | query | string | false    | Block number for historical account state retrieval.      |
| blockHash   | query | string | false    | Block hash for historical account state retrieval.        |

> Example responses

> 200 Response

```json
{
  "accounts": [
    {
      "account": {
        "account": {
          "balance": { "dataType": "bi", "value": "8459498e6871287fa0000" },
          "codeHash": { "value": "xdJGAYb3IzySfn2y3McDwOUAtlPKgic7e/rYBF2FpHA=", "dataType": "u8ab" },
          "nonce": { "dataType": "bi", "value": "1" },
          "storageRoot": { "value": "VugfFxvMVab/g0XmksD4bltI4BuZbK3AAWIvteNjtCE=", "dataType": "u8ab" }
        },
        "accountType": 0,
        "ethAddress": "0x52f8d3daa7b5ff25ca2bf7417e059afe0bd5fb0e",
        "hash": "23d5935422410e63f65235c56eb84ca8c1b4bdc2de2095ff4ffce98d8265c5a3",
        "operatorAccountInfo": {
          "certExp": 1738952142004,
          "lastStakeTimestamp": 1738950223935,
          "nominee": "c66050c0ed82e374b7150ef69de81fb8fdaf92f3acb5982a66443e3f3ab48265",
          "operatorStats": {
            "history": [],
            "isShardeumRun": false,
            "lastStakedNodeKey": "",
            "totalNodePenalty": { "dataType": "bi", "value": "0" },
            "totalNodeReward": { "dataType": "bi", "value": "0" },
            "totalNodeTime": 0,
            "totalUnstakeReward": { "dataType": "bi", "value": "0" },
            "unstakeCount": 0
          },
          "stake": { "dataType": "bi", "value": "8ac7230489e80000" }
        },
        "timestamp": 1738950342004
      },
      "accountId": "52f8d3daa7b5ff25ca2bf7417e059afe0bd5fb0e000000000000000000000000",
      "accountType": 0,
      "contractInfo": null,
      "contractType": null,
      "cycle": 1353,
      "ethAddress": "0x52f8d3daa7b5ff25ca2bf7417e059afe0bd5fb0e",
      "hash": "23d5935422410e63f65235c56eb84ca8c1b4bdc2de2095ff4ffce98d8265c5a3",
      "isGlobal": 0,
      "timestamp": 1738950342004
    }
  ],
  "success": true,
  "totalAccounts": 1,
  "totalContracts": 3,
  "totalPages": 0
}
```

<h3 id="get__api_account-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                    |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [AccountResponse](#schemaaccountresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)     |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_token

`GET /api/token`

_Get token information_

<h3 id="get__api_token-parameters">Parameters</h3>

| Name            | In    | Type   | Required | Description                             |
| --------------- | ----- | ------ | -------- | --------------------------------------- |
| page            | query | string | false    | Page number for paginated results.      |
| address         | query | string | false    | Account address to retrieve tokens for. |
| contractAddress | query | string | false    | Contract address to filter tokens.      |
| tokenType       | query | string | false    | Type of token to filter.                |

> Example responses

> 200 Response

```json
{
  "success": true,
  "tokens": [{}],
  "totalPages": 0,
  "totalTokenHolders": 0
}
```

<h3 id="get__api_token-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [TokenResponse](#schematokenresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_transaction

`GET /api/transaction`

_Get transaction information_

<h3 id="get__api_transaction-parameters">Parameters</h3>

| Name            | In    | Type   | Required | Description                                                               |
| --------------- | ----- | ------ | -------- | ------------------------------------------------------------------------- |
| count           | query | string | false    | Number of transactions to retrieve (maximum 1000).                        |
| page            | query | string | false    | Page number for paginated results.                                        |
| txHash          | query | string | false    | Transaction hash to query (must be 66 characters).                        |
| address         | query | string | false    | Account address to filter transactions (42 or 64 characters).             |
| token           | query | string | false    | Token address for additional filtering.                                   |
| filterAddress   | query | string | false    | Secondary filter for token balance (must be 42 characters).               |
| txType          | query | string | false    | Transaction type filter.                                                  |
| startCycle      | query | string | false    | Starting cycle number for transaction query.                              |
| endCycle        | query | string | false    | Ending cycle number for transaction query (max range of 100 cycles).      |
| txId            | query | string | false    | Unique transaction identifier.                                            |
| type            | query | string | false    | Additional flag; set to "requery" to force a fresh database lookup.       |
| totalStakeData  | query | string | false    | Set "true" to retrieve total stake and unstake transaction data.          |
| beforeTimestamp | query | string | false    | Filter transactions with a timestamp before this value (in milliseconds). |
| afterTimestamp  | query | string | false    | Filter transactions with a timestamp after this value (in milliseconds).  |
| blockNumber     | query | string | false    | Block number for historical transaction retrieval (non-negative).         |
| blockHash       | query | string | false    | Block hash for historical transaction retrieval (must be 66 characters).  |

> Example responses

> 200 Response

```json
{
  "success": true,
  "totalPages": 0,
  "totalTransactions": 30086720,
  "transactions": [
    {
      "blockHash": "0x0823059503ec75824ed522459da655b2ecf0433b59e0a2e1efda891608bb3e6b",
      "blockNumber": 866578,
      "cycle": 86656,
      "internalTXType": "null",
      "nominee": null,
      "originalTxData": {
        "timestampReceipt": {
          "cycleCounter": 86656,
          "cycleMarker": "d099780fb2c6b6514de2039f702c224667cfc9cdbd04a35d0a1acc04175ae909",
          "sign": {
            "owner": "b090d7faebd0ffe7c7f59b6fe4e2278fe7433db31ceb0168e58e38d391e9a994",
            "sig": "ff5c40dfd78d6e140550a9c4b340fe03fe4b224cafebbcc359019997cbbbedea586fcba2073138f3d6bb37183aca22e98503a5a23bfe54cf78cd74a7f25a4d0db2742228d0834a7edd1aa3da2cb07c5690ac7bf639145d8f366c12892bd21180"
          },
          "timestamp": 1739270837075,
          "txId": "b65f5df7431f5b5ae07d68acc2502a565e5e49378ae6ac00c42c2eb99a03a856"
        },
        "tx": {
          "raw": "0xf86f81f985174876e800825208943aa7455500ca6c934f03d4b2102ffa57a0949fdc880de0b6b3a764000080823f47a0ef407925c295fa521ba640758c42755a513b91eb7a102ca797be77ce6593d4dba0398faa1ab50926bd8cc803d3eab750cb9277b0705c980b8f0bbfdadc48fd4729",
          "timestamp": 1739270833380
        }
      },
      "timestamp": 1739270837075,
      "transactionType": 0,
      "txFrom": "0x3aa7455500ca6c934f03d4b2102ffa57a0949fdc",
      "txHash": "0xa826634aadd99f174de1935d00e1454cdc1cdb62a49d58de0813a0aa4f4d1646",
      "txId": "b65f5df7431f5b5ae07d68acc2502a565e5e49378ae6ac00c42c2eb99a03a856",
      "txTo": "0x3aa7455500ca6c934f03d4b2102ffa57a0949fdc",
      "wrappedEVMAccount": {
        "accountType": 3,
        "amountSpent": "0x145a950564b4b0",
        "ethAddress": "0xa826634aadd99f174de1935d00e1454cdc1cdb62a49d58de0813a0aa4f4d1646",
        "hash": "f687a6eee5b82f4c18fbf724f562e11ace34807d53853b37b457cb7fd9245265",
        "readableReceipt": {
          "blockHash": "0x0823059503ec75824ed522459da655b2ecf0433b59e0a2e1efda891608bb3e6b",
          "blockNumber": "0xd3912",
          "chainId": "0x1f92",
          "contractAddress": null,
          "cumulativeGasUsed": "0x5208",
          "data": "0x",
          "from": "0x3aa7455500ca6c934f03d4b2102ffa57a0949fdc",
          "gasLimit": "0x5208",
          "gasPrice": "0x3f84fc7516",
          "gasRefund": "0x0",
          "gasUsed": "0x5208",
          "logs": [],
          "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          "nonce": "0xf9",
          "r": "0xef407925c295fa521ba640758c42755a513b91eb7a102ca797be77ce6593d4db",
          "s": "0x398faa1ab50926bd8cc803d3eab750cb9277b0705c980b8f0bbfdadc48fd4729",
          "status": 1,
          "to": "0x3aa7455500ca6c934f03d4b2102ffa57a0949fdc",
          "transactionHash": "0xa826634aadd99f174de1935d00e1454cdc1cdb62a49d58de0813a0aa4f4d1646",
          "transactionIndex": "0x1",
          "type": "0x0",
          "v": "0x3f47",
          "value": "0xde0b6b3a7640000"
        },
        "receipt": {
          "bitvector": {
            "value": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
            "dataType": "u8ab"
          },
          "cumulativeBlockGasUsed": {
            "dataType": "bi",
            "value": "5208"
          },
          "logs": [],
          "status": 1
        },
        "timestamp": 1739270837075,
        "txFrom": "0x3aa7455500ca6c934f03d4b2102ffa57a0949fdc",
        "txId": "b65f5df7431f5b5ae07d68acc2502a565e5e49378ae6ac00c42c2eb99a03a856"
      }
    }
  ]
}
```

<h3 id="get__api_transaction-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                            |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [TransactionResponse](#schematransactionresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)             |

<aside class="success">
This operation does not require authentication
</aside>

## get__usage_metrics

`GET /usage/metrics`

_Get usage metrics_

> Example responses

> 200 Response

```json
{
  "enabled": true,
  "enabledAt": "",
  "enableForInMinutes": 0,
  "usage": {},
  "errors": {}
}
```

<h3 id="get__usage_metrics-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                    |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [MetricsResponse](#schemametricsresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)     |

<aside class="success">
This operation requires a security key in the request headers under 'x-usage-key'.
</aside>

## get__api_receipt

`GET /api/receipt`

_Get receipt information_

<h3 id="get__api_receipt-parameters">Parameters</h3>

| Name       | In    | Type   | Required | Description                                   |
| ---------- | ----- | ------ | -------- | --------------------------------------------- |
| count      | query | string | false    | Number of receipts to retrieve (maximum 1000) |
| page       | query | string | false    | Page number for pagination                    |
| txId       | query | string | false    | Transaction ID to retrieve a specific receipt |
| startCycle | query | string | false    | Starting cycle number for filtering receipts  |
| endCycle   | query | string | false    | Ending cycle number for filtering receipts    |

> Example responses

> 200 Response

```json
{
  "receipts": [
    {
      "afterStates": [
        {
          "accountId": "1000000000000000000000000000000000000000000000000000000000000001",
          "data": {
            "accountType": 5,
            "current": {
              "activeVersion": "1.16.0",
              "archiver": {
                "activeVersion": "3.5.6",
                "latestVersion": "3.5.6",
                "minVersion": "3.5.6"
              },
              "certCycleDuration": 30,
              "description": "These are the initial network parameters Shardeum started with",
              "enableNodeSlashing": false,
              "enableRPCEndpoints": false,
              "latestVersion": "1.16.0",
              "maintenanceFee": 0,
              "maintenanceInterval": 86400000,
              "minVersion": "1.16.0",
              "nodePenaltyUsd": {
                "dataType": "bi",
                "value": "8ac7230489e80000"
              },
              "nodeRewardAmountUsd": {
                "dataType": "bi",
                "value": "de0b6b3a7640000"
              },
              "nodeRewardInterval": 3600000,
              "restakeCooldown": 1800000,
              "slashing": {
                "enableLeftNetworkEarlySlashing": false,
                "enableNodeRefutedSlashing": false,
                "enableSyncTimeoutSlashing": false,
                "leftNetworkEarlyPenaltyPercent": 0.2,
                "nodeRefutedPenaltyPercent": 0.2,
                "syncTimeoutPenaltyPercent": 0.2
              },
              "stabilityScaleDiv": 1000,
              "stabilityScaleMul": 1000,
              "stakeLockTime": 10800000,
              "stakeRequiredUsd": {
                "dataType": "bi",
                "value": "8ac7230489e80000"
              },
              "title": "Initial parameters",
              "txPause": false
            },
            "hash": "2e285208c1a642ecee5e09ac3be9f9d1cea283fd04534464d427af7e8af2d43c",
            "id": "1000000000000000000000000000000000000000000000000000000000000001",
            "listOfChanges": [
              {
                "change": {
                  "crypto": {
                    "hashKey": "69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc",
                    "keyPairConfig": {
                      "keyPairJsonFile": "secrets.json",
                      "useKeyPairFromFile": true
                    }
                  },
                  "debug": {
                    "beforeStateFailChance": 0,
                    "canDataRepair": false,
                    "checkAddressFormat": true,
                    "checkTxGroupChanges": true,
                    "countEndpointStart": -1,
                    "countEndpointStop": -1,
                    "debugNTPBogusDecrements": false,
                    "debugNTPErrorWindowMs": 200,
                    "debugNoTxVoting": false,
                    "debugStatListMaxSize": 1000,
                    "devPublicKeys": {
                      "000aa90686097de101bb5fad9cc4af6ccf568b4612d8dd032497a8ac9ccba91f": 3,
                      "02c8a6d5360bdb886dbd9dfa0ec73e23c32be98fb9745a0ba9d63b54af04859d": 3,
                      "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9": 3,
                      "13e2c5b6990b92d769239bc289a57246d4c000bf1f2c3f426c24b8eaac78f21c": 3,
                      "154cca8f6394fe43a08b579a4fd5fc666cf69b2b1f54364790f35bf4d612cf66": 3,
                      "1bc657b085acb240d8315857a1a1c532571e47d409c1bddd8d071b2af530c2be": 3,
                      "230b6172aba54d592171bd3f2a599f5688b1447fb636eedbc39298ab7d9c05c2": 3,
                      "23526214a0325ef9a3fd53b7067c7a138d7bc3c6e78b907a15af793f971028ec": 3,
                      "26c333f353c06766cf811ba97572409848c90fb66291d8ef91e25c4d1bf439c7": 3,
                      "343fcbcc4191b312120e45d2f190d44ca8696f2777dfcc8b6c2ac6756abc2671": 3,
                      "3cbc079e9b44ba215256444433314262a8e1d342d37b4e8c0c9ab27e78dad167": 3,
                      "3dfb1794a88ad3c19b63b9ef2006d45f7c01acedd7795908457f1470f8d10d2f": 3,
                      "4347a51c55921f7ffdf00ebc84d0849598a59fc9eb244bcbf5a4e26abad0a005": 3,
                      "4ce16834c272a5db61ca34a93d1dfa86ae9355fabef9f1af7b6e0d8e4a5aa0ab": 3,
                      "5988415bc8675f94e0059099ddf1c414ca737562f33e6f1091e8fee307d3352c": 3,
                      "79fadced0d463a88d837485228004a0671c9baa2ff24ec6251b569a5bc0abc3e": 3,
                      "8999bd238993c42921528b333774c54410d2d48606e54e58d798241f6942aabf": 3,
                      "971ebbe78cce7bfa0ada5a7a0810c53ff72287e91b2f43bea3703409005590cf": 3,
                      "abb118e65bbd834d3f9c3135f72a3ed883b5c3b85c9e4a647b142f2824663e20": 3,
                      "b17be71f65ec9804404de1333a93132b83a1d614a3d14a78db5c7e3219e49524": 3,
                      "cd38e866813e063423adf2b1bb7608eef7f62c306c3b8007db925a6aafb3c0f5": 3,
                      "d5b9be544b7f6d119ea52ce7f82870d4249ad663f0a75e68096df44c7843a9f8": 3,
                      "e55a70ae4ea0a1ef4760d40df72a78016fddbaa70e479d032ddbb6f77a07ddc8": 3,
                      "e7849fa46ebe9e2091599d12e5c11c8fcf9051633065348b05ab7adf0962f192": 3,
                      "ee2e6e301f1e4474317f6e3d1e9c9e8d6abccd9a263654e639303e4aadc9ff32": 3,
                      "fe60d9a1d0ead0132a0dceb82bd6faf9b1b509a08769e83e500a12ae0ae8d1d5": 3
                    },
                    "disableLostNodeReports": false,
                    "disableSnapshots": true,
                    "disableTxCoverageReport": true,
                    "dumpAccountReportFromSQL": false,
                    "enableBasicProfiling": true,
                    "enableCycleRecordDebugTool": false,
                    "enableScopedProfiling": false,
                    "enableTestMode": false,
                    "failNoRepairTxChance": 0,
                    "failReceiptChance": 0,
                    "fakeNetworkDelay": 0,
                    "finishedSyncingDelay": 0,
                    "forcedExpiration": false,
                    "forwardTXToSyncingNeighbors": false,
                    "haltOnDataOOS": false,
                    "hashedDevAuth": "",
                    "highResolutionProfiling": true,
                    "ignoreDataTellChance": 0,
                    "ignoreRecieptChance": 0,
                    "ignoreScaleGossipSelfCheck": false,
                    "ignoreStandbyRefreshChance": 0,
                    "ignoreTimeCheck": false,
                    "ignoreVoteChance": 0,
                    "localEnableCycleRecordDebugTool": false,
                    "loseReceiptChance": 0,
                    "loseTxChance": 0,
                    "minMultiSigRequiredForEndpoints": 1,
                    "minMultiSigRequiredForGlobalTxs": 1,
                    "multisigKeys": {
                      "0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5": 3,
                      "0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76": 3,
                      "0x353Ad64Df4fAe5EffF717A1c41BE6dEBee543129": 3,
                      "0x4563303BCE96D3f8d9C7fB94b36dfFC9d831871d": 3,
                      "0x4ed5C053BF2dA5F694b322EA93dce949F3276B85": 3,
                      "0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E": 3,
                      "0x550817e7B91244BBeFE2AD621ccD555A16B00405": 3,
                      "0x6A83e4e4eB0A2c8f562db6BB64b02a9A6237B314": 3,
                      "0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6": 3,
                      "0x7Fb9b1C5E20bd250870F87659E46bED410221f17": 3,
                      "0x80aF8E195B56aCC3b4ec8e2C99EC38957258635a": 3,
                      "0x8282F755e784414697421D4b59232E5d194e2262": 3,
                      "0x84C55a4bFfff1ADadb9C46e2B60979F519dAf874": 3,
                      "0x891DF765C855E9848A18Ed18984B9f57cb3a4d47": 3,
                      "0x92E375E0c76CaE76D9DfBab17EE7B3B4EE407715": 3,
                      "0x9Ce1C3c114538c625aA2488b97fEb3723fdBB07B": 3,
                      "0xA04A1B214a2537139fE59488820D4dA06516933f": 3,
                      "0xBD79B430CA932e2D89bb77ACaE7367a07471c2eA": 3,
                      "0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00": 3,
                      "0xCeA068d8DCB4B4020D30a9950C00cF8408611F67": 3,
                      "0xD815DA50966c19261B34Ffa3bE50A30A67D97456": 3,
                      "0xE856B2365641eba73Bc430AAC1E8F930dA513D9D": 3,
                      "0xF82BDA6Ef512e4219C6DCEea896E50e8180a5bff": 3,
                      "0xa58169308e7153B5Ce4ca5cA515cC4d0cBE7770B": 3,
                      "0xd31aBC7497aD8bC9fe8555C9eDe45DFd7FB3Bf6F": 3,
                      "0xdA058F9c7Ce86C1D21DD5DBDeBad5ab5c785520a": 3,
                      "0xe7e4cc292b424C6D50d16F1Bb5BAB2032c486980": 3,
                      "0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe": 3
                    },
                    "oldPartitionSystem": false,
                    "produceBadChallenge": false,
                    "produceBadVote": false,
                    "profiler": false,
                    "randomCycleData": false,
                    "readyNodeDelay": 0,
                    "recordAcceptedTx": false,
                    "recordAccountStates": false,
                    "robustQueryDebug": false,
                    "sanitizeInput": false,
                    "skipPatcherRepair": false,
                    "startInErrorLogMode": false,
                    "startInFatalsLogMode": true,
                    "startedSyncingDelay": 0,
                    "useNewParitionReport": false,
                    "useShardusMemoryPatterns": true,
                    "verboseNestedCounters": false,
                    "voteFlipChance": 0
                  },
                  "features": {
                    "archiverDataSubscriptionsUpdate": true,
                    "dappFeature1enabled": true,
                    "enableRIAccountsCache": true,
                    "fixHomeNodeCheckForTXGroupChanges": true,
                    "startInServiceMode": false,
                    "tickets": {
                      "ticketTypes": [
                        {
                          "enabled": true,
                          "type": "silver"
                        }
                      ],
                      "updateTicketListTimeInMs": 600000
                    }
                  },
                  "globalAccount": "1000000000000000000000000000000000000000000000000000000000000001",
                  "heartbeatInterval": 5,
                  "loadDetection": {
                    "desiredTxTime": 10000000,
                    "executeQueueLimit": 160,
                    "highThreshold": 0.5,
                    "lowThreshold": 0.2,
                    "queueLimit": 320
                  },
                  "mode": "release",
                  "network": {
                    "timeout": 5
                  },
                  "nonceMode": true,
                  "p2p": {
                    "activeRecoveryEnabled": true,
                    "aggregateLostReportsTillQ1": true,
                    "allowActivePerCycle": 1,
                    "allowActivePerCycleRecover": 4,
                    "amountToGrow": 30,
                    "amountToShrink": 5,
                    "attemptJoiningWaitMultiplier": 2,
                    "baselineNodes": 640,
                    "checkNetworkStopped": false,
                    "checkVersion": false,
                    "continueOnException": false,
                    "cycleDuration": 60,
                    "cyclesToRefreshEarly": 4,
                    "cyclesToWaitForSyncStarted": 5,
                    "delayLostReportByNumOfCycles": 1,
                    "delayZombieRestartSec": 180,
                    "detectLostSyncing": true,
                    "difficulty": 2,
                    "downNodeFilteringEnabled": false,
                    "dynamicBogonFiltering": true,
                    "dynamicGossipFactor": false,
                    "enableLostArchiversCycles": false,
                    "enableMaxStandbyCount": true,
                    "existingArchivers": [
                      {
                        "ip": "35.193.191.159",
                        "port": 4000,
                        "publicKey": "1c63734aedef5665d6cf02d3a79ae30aedcbd27eae3b76fff05d587a6ac62981"
                      }
                    ],
                    "experimentalSnapshot": true,
                    "extraCyclesToKeep": 33,
                    "extraCyclesToKeepMultiplier": 1,
                    "extraNodesToAddInRestart": 5,
                    "firstCycleJoin": 0,
                    "forceBogonFilteringOn": true,
                    "forcedMode": "",
                    "formingNodesPerCycle": 16,
                    "getTxTimestampTimeoutOffset": 0,
                    "goldenTicketEnabled": true,
                    "gossipFactor": 4,
                    "gossipRecipients": 8,
                    "gossipSeedFallof": 15,
                    "gossipStartSeed": 15,
                    "gossipTimeout": 180,
                    "hackForceCycleSyncComplete": false,
                    "hardenNewSyncingProtocol": true,
                    "headerSizeLimitInBytes": 2048,
                    "initShutdown": false,
                    "instantForwardReceipts": true,
                    "ipServers": [
                      "https://ipapi.co/json",
                      "https://ifconfig.co/json",
                      "https://ipinfo.io/json",
                      "api.ipify.org/?format=json"
                    ],
                    "isDownCacheEnabled": true,
                    "isDownCachePruneCycles": 10,
                    "lostArchiversCyclesToWait": 1000000,
                    "lostMapPruneCycles": 10,
                    "lruCacheSizeForSocketMgmt": 500,
                    "maxArchiversSubscriptionPerNode": 2,
                    "maxDesiredMultiplier": 1.2,
                    "maxJoinedPerCycle": 10,
                    "maxNodeForSyncTime": 9,
                    "maxNodes": 1200,
                    "maxPercentOfDelta": 40,
                    "maxRejoinTime": 20,
                    "maxRotatedPerCycle": 1,
                    "maxScaleReqs": 250,
                    "maxSeedNodes": 10,
                    "maxShrinkMultiplier": 0.02,
                    "maxStandbyCount": 30000,
                    "maxSyncTimeFloor": 10000,
                    "maxSyncingPerCycle": 10,
                    "minChecksForDown": 1,
                    "minChecksForUp": 1,
                    "minNodes": 640,
                    "minNodesPerctToAllowExitOnException": 0.66,
                    "minNodesToAllowTxs": 1,
                    "minScaleReqsNeeded": 5,
                    "networkBaselineEnabled": true,
                    "networkTransactionsToProcessPerCycle": 20,
                    "nodeExpiryAge": 30,
                    "numCheckerNodes": 1,
                    "payloadSizeLimitInBytes": 2097152,
                    "preGossipDownCheck": true,
                    "preGossipLostCheck": true,
                    "preGossipNodeCheck": true,
                    "preGossipRecentCheck": true,
                    "q1DelayPercent": 0.125,
                    "queryDelay": 1,
                    "randomJoinRequestWait": 2000,
                    "rejectBogonOutboundJoin": true,
                    "removeLostSyncingNodeFromList": true,
                    "requiredVotesPercentage": 0.6666666666666666,
                    "resubmitStandbyAddWaitDuration": 1000,
                    "resumbitStandbyRefreshWaitDuration": 1000,
                    "rotationCountAdd": 0,
                    "rotationCountMultiply": 3,
                    "rotationEdgeToAvoid": 0,
                    "rotationMaxAddPercent": 0.1,
                    "rotationMaxRemovePercent": 0.05,
                    "rotationPercentActive": 0.001,
                    "scaleConsensusRequired": 0.25,
                    "scaleGroupLimit": 25,
                    "scaleInfluenceForShrink": 0.2,
                    "secondsToCheckForQ1": 1000,
                    "seedNodeOffset": 4,
                    "standbyAgeCheck": true,
                    "standbyAgeScrub": true,
                    "standbyListCyclesTTL": 1440,
                    "standbyListFastHash": true,
                    "standbyListMaxRemoveApp": 100,
                    "standbyListMaxRemoveTTL": 100,
                    "standbyVersionScrub": true,
                    "startInWitnessMode": false,
                    "stopReportingLostPruneCycles": 10,
                    "syncBoostEnabled": false,
                    "syncFloorEnabled": true,
                    "syncLimit": 180,
                    "syncingDesiredMinCount": 50,
                    "syncingMaxAddPercent": 0.2,
                    "timeServers": ["0.pool.ntp.org", "1.pool.ntp.org", "2.pool.ntp.org", "3.pool.ntp.org"],
                    "timestampCacheFix": true,
                    "uniqueLostIdsUpdate": false,
                    "uniqueRemovedIds": true,
                    "uniqueRemovedIdsUpdate": true,
                    "useAjvCycleRecordValidation": true,
                    "useCombinedTellBinary": true,
                    "useFactCorrespondingTell": true,
                    "useFakeTimeOffsets": true,
                    "useJoinProtocolV2": true,
                    "useLruCacheForSocketMgmt": true,
                    "useNTPOffsets": true,
                    "useNetworkModes": true,
                    "useProxyForDownCheck": false,
                    "useSignaturesForAuth": true,
                    "useSyncProtocolV2": true,
                    "validateActiveRequests": true,
                    "validateArchiverAppData": false,
                    "writeSyncProtocolV2": true
                  },
                  "rateLimiting": {
                    "limitRate": true,
                    "loadLimit": {
                      "executeQueueLength": 0.6,
                      "external": 0.6,
                      "internal": 0.6,
                      "queueLength": 0.6,
                      "txTimeInQueue": 0.6
                    }
                  },
                  "reporting": {
                    "console": false,
                    "interval": 2,
                    "logSocketReports": true,
                    "recipient": "http://34.28.123.3:3000/api",
                    "report": true
                  },
                  "sharding": {
                    "executeInOneShard": true,
                    "nodesPerConsensusGroup": 128,
                    "nodesPerEdge": 5
                  },
                  "stateManager": {
                    "accountBucketSize": 500,
                    "apopFromStuckProcessing": false,
                    "attachDataToReceipt": true,
                    "autoUnstickProcessing": false,
                    "avoidOurIndexInFactTell": false,
                    "awaitingDataCanBailOnReceipt": true,
                    "canRequestFinalData": true,
                    "checkPrecrackStatus": true,
                    "collectedDataFix": true,
                    "concatCorrespondingTellUseUnwrapped": true,
                    "configChangeMaxChangesToKeep": 1000,
                    "configChangeMaxCyclesToKeep": 5,
                    "confirmationSeenExpirationTime": 30000,
                    "correspondingTellUseUnwrapped": true,
                    "deterministicTXCycleEnabled": true,
                    "disableTxExpiration": true,
                    "discardVeryOldPendingTX": false,
                    "enableAccountFetchForQueueCounts": false,
                    "fallbackToCurrentCycleFortxGroup": false,
                    "fifoUnlockFix": true,
                    "fifoUnlockFix2": false,
                    "fifoUnlockFix3": false,
                    "filterReceivingNodesForTXData": false,
                    "forceVoteForFailedPreApply": true,
                    "forwardToLuckyMulti": false,
                    "forwardToLuckyNodes": false,
                    "forwardToLuckyNodesCheckRotation": true,
                    "forwardToLuckyNodesNonceQueue": true,
                    "forwardToLuckyNodesNonceQueueLimitFix": true,
                    "gossipCompleteData": false,
                    "includeBeforeStatesInReceipts": true,
                    "integrityCheckBeforeChallenge": true,
                    "maxCyclesShardDataToKeep": 20,
                    "maxDataSyncRestarts": 5,
                    "maxNonceQueueSize": 100000,
                    "maxPendingNonceTxs": 10,
                    "maxTrackerRestarts": 5,
                    "minRequiredChallenges": 1,
                    "noRepairIfDataAttached": false,
                    "noVoteSeenExpirationTime": 10000,
                    "nodesToGossipAppliedReceipt": 10,
                    "nonExWaitForData": 5000,
                    "numberOfReInjectNodes": 5,
                    "patcherAccountsPerRequest": 250,
                    "patcherAccountsPerUpdate": 2500,
                    "patcherMaxChildHashResponses": 2000,
                    "patcherMaxHashesPerRequest": 300,
                    "patcherMaxLeafHashesPerRequest": 300,
                    "poqobatchCount": 1,
                    "poqoloopTime": 2000,
                    "receiptRemoveFix": true,
                    "reduceTimeFromTxTimestamp": 60000,
                    "rejectSharedDataIfCovered": false,
                    "removeStuckChallengedTXs": false,
                    "removeStuckTxsFromQueue": true,
                    "removeStuckTxsFromQueue2": false,
                    "removeStuckTxsFromQueue3": true,
                    "requestAwaitedDataAllowed": false,
                    "shareCompleteData": false,
                    "singleAccountStuckFix": true,
                    "stateTableBucketSize": 500,
                    "stuckProcessingLimit": 300,
                    "stuckTxMoveTime": 3600000,
                    "stuckTxQueueFix": true,
                    "stuckTxRemoveTime": 600000,
                    "stuckTxRemoveTime2": 120000,
                    "stuckTxRemoveTime3": 300000,
                    "syncWithAccountOffset": true,
                    "transactionApplyTimeout": -1,
                    "txStateMachineChanges": true,
                    "useAccountCopiesTable": false,
                    "useCopiedWrappedStateForApply": true,
                    "useNewPOQ": false,
                    "usePOQo": true,
                    "voteSeenExpirationTime": 20000,
                    "voterPercentage": 0.1,
                    "waitLimitAfterFirstMessage": 2000,
                    "waitLimitAfterFirstVote": 2000,
                    "waitTimeBeforeConfirm": 200,
                    "waitTimeBeforeReceipt": 200,
                    "waitUpstreamTx": false
                  },
                  "statistics": {
                    "interval": 1,
                    "save": true
                  },
                  "transactionExpireTime": 5
                },
                "cycle": 1
              }
            ],
            "mode": "release",
            "next": {},
            "timestamp": 1734071572223
          },
          "hash": "2e285208c1a642ecee5e09ac3be9f9d1cea283fd04534464d427af7e8af2d43c",
          "isGlobal": true,
          "timestamp": 1734071572223
        }
      ],
      "appReceiptData": {
        "accountId": "a1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a",
        "data": {
          "accountType": 12,
          "amountSpent": "0x0",
          "ethAddress": "0xa1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a",
          "hash": "6421f8ac73bde9c9621b59f457f3be752e966d1470fe7323e67f54cb855dc9c5",
          "readableReceipt": {
            "blockHash": "0x39737a7b55252baf202a806667f73cec22bad1895d2b02482864cb5951649518",
            "blockNumber": "0x21",
            "contractAddress": null,
            "cumulativeGasUsed": "0x0",
            "data": "0x0",
            "from": "1000000000000000000000000000000000000000000000000000000000000001",
            "gasRefund": "0x0",
            "gasUsed": "0x0",
            "internalTx": {
              "internalTXType": 1,
              "isInternalTx": true,
              "network": "1000000000000000000000000000000000000000000000000000000000000001",
              "sign": null,
              "timestamp": 1734071572223
            },
            "isInternalTx": true,
            "logs": [],
            "logsBloom": "",
            "nonce": "0x0",
            "status": 1,
            "to": "1000000000000000000000000000000000000000000000000000000000000001",
            "transactionHash": "0xa1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a",
            "transactionIndex": "0x1",
            "value": "0x0"
          },
          "receipt": null,
          "timestamp": 1734071572223,
          "txFrom": "1000000000000000000000000000000000000000000000000000000000000001",
          "txId": "a1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a"
        },
        "stateId": "6421f8ac73bde9c9621b59f457f3be752e966d1470fe7323e67f54cb855dc9c5",
        "timestamp": 1734071572223
      },
      "applyTimestamp": 1734071572223,
      "beforeStates": [],
      "cycle": 2,
      "executionShardKey": "1000000000000000000000000000000000000000000000000000000000000001",
      "globalModification": 1,
      "receiptId": "a1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a",
      "signedReceipt": {
        "signs": [
          {
            "owner": "faa05c4a7b5eca4c47ee62517d282f5b1ca09b4e87e0bebdb6f7151f649f04a7",
            "sig": "617a8ad9a0a3e23d1ee958bc23e5de209c021a24dd21aeacd0b8edd9d94a47150cb3aa3057c5f03d3f19979714f1d9c28bbd5c40cbd1a690dfda477dc386ea0add4e6d170134c5b6b714f8fb776bfa87facd4f39a1ccc18714b75f1d97f266c1"
          }
        ],
        "tx": {
          "address": "1000000000000000000000000000000000000000000000000000000000000001",
          "addressHash": "",
          "source": "1000000000000000000000000000000000000000000000000000000000000001",
          "value": {
            "internalTXType": 1,
            "isInternalTx": true,
            "network": "1000000000000000000000000000000000000000000000000000000000000001",
            "timestamp": 1734071572223
          },
          "when": 1734071572223
        }
      },
      "timestamp": 1734071572223,
      "tx": {
        "originalTxData": {
          "tx": {
            "internalTXType": 1,
            "isInternalTx": true,
            "network": "1000000000000000000000000000000000000000000000000000000000000001",
            "timestamp": 1734071572223
          }
        },
        "timestamp": 1734071572223,
        "txId": "a1af005e395694a8e48ba0bf0841b9c749192106f5750934d32940cce9ea135a"
      }
    }
  ],
  "success": true,
  "totalReceipts": 31083848
}
```

<h3 id="get__api_receipt-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                    |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [ReceiptResponse](#schemareceiptresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)     |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_originalTx

`GET /api/originalTx`

_Get original transaction information_

<h3 id="get__api_originaltx-parameters">Parameters</h3>

| Name       | In    | Type   | Required | Description                                                  |
| ---------- | ----- | ------ | -------- | ------------------------------------------------------------ |
| count      | query | string | false    | Number of original transactions to retrieve (maximum 1000)   |
| page       | query | string | false    | Page number for pagination                                   |
| txId       | query | string | false    | Transaction ID to retrieve a specific original transaction   |
| txHash     | query | string | false    | Transaction hash to retrieve a specific original transaction |
| startCycle | query | string | false    | Starting cycle number for filtering original transactions    |
| endCycle   | query | string | false    | Ending cycle number for filtering original transactions      |
| decode     | query | string | false    | Whether to decode the EVM raw transaction data               |
| pending    | query | string | false    | Filter for pending transactions                              |

> Example responses

> 200 Response

```json
{
  "originalTxs": [
    {
      "cycle": 89275,
      "originalTxData": {
        "timestampReceipt": {
          "cycleCounter": 89274,
          "cycleMarker": "7acf83c57ebac24fa35292a5df9625ee9b91753299b9d09322a47ff4b734069a",
          "sign": {
            "owner": "eeaaa9de1080e99ab6eae9b8361433cfbe7273ab4c85bc48c748e4e911572daa",
            "sig": "e5421e303afc4b872ec4eebcd514b7939795fdfa85e9a0c337912fb29f973fc1053b5f584c9a8040d291ec58f9de206a92099cb41d67307c28724d78d75b23024e11ea6e2d5998645efc717c09e4427c536558d3e8085e0ad2d0bf5e6376fbc3"
          },
          "timestamp": 1739427906619,
          "txId": "5a7635bfa30f66f26a7e2227b2e209a4e08b2c9068a5f20aee6c0ecaa2eb2d3c"
        },
        "tx": {
          "raw": "0xf871820108854c392ef2e78344aa209455679851a0445e2f8c7e8f718a3400881303d65d880de0b6b3a764000080823f48a0e9260fff4f77612df4cd74ff311ae28694c6818af2badcc6db5aeee16f2a02aba05334bf9d9442bf97cbca2fcb1f68203367724d6ca94c246c0be14449c523e15c",
          "timestamp": 1739427897901
        }
      },
      "timestamp": 1739427906619,
      "txId": "5a7635bfa30f66f26a7e2227b2e209a4e08b2c9068a5f20aee6c0ecaa2eb2d3c"
    }
  ],
  "success": true,
  "totalOriginalTxs": 31500819,
  "totalPages": 0
}
```

<h3 id="get__api_originaltx-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                          |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [OriginalTxResponse](#schemaoriginaltxresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)           |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_log

`GET /api/log`

_Get log information_

<h3 id="get__api_log-parameters">Parameters</h3>

| Name      | In    | Type   | Required | Description                               |
| --------- | ----- | ------ | -------- | ----------------------------------------- |
| count     | query | string | false    | Number of logs to retrieve (maximum 1000) |
| page      | query | string | false    | Page number for pagination                |
| address   | query | string | false    | Filter logs by address                    |
| topic0    | query | string | false    | First topic filter                        |
| topic1    | query | string | false    | Second topic filter                       |
| topic2    | query | string | false    | Third topic filter                        |
| topic3    | query | string | false    | Fourth topic filter                       |
| type      | query | string | false    | Filter for transaction type               |
| fromBlock | query | string | false    | Starting block number for filtering logs  |
| toBlock   | query | string | false    | Ending block number for filtering logs    |
| blockHash | query | string | false    | Filter logs by block hash                 |

> Example responses

> 200 Response

```json
{
  "success": true,
  "logs": [{}],
  "totalLogs": 0,
  "totalPages": 0,
  "transactions": []
}
```

<h3 id="get__api_log-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [LogResponse](#schemalogresponse)     |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

<aside class="success">
This operation does not require authentication
</aside>

## get__totalData

`GET /totalData`

_Get total data information_

<h3 id="get__totaldata-parameters">Parameters</h3>

None

> Example responses

> 200 Response

```json
{
  "totalAccounts": 13968262,
  "totalCycles": 89279,
  "totalOriginalTxs": 31502184,
  "totalReceipts": 31087646,
  "totalTransactions": 31087645
}
```

<h3 id="get__totaldata-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                        |
| ------ | ---------------------------------------------------------------- | ------------------- | --------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [TotalDataResponse](#schematotaldataresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)         |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_blocks

`GET /api/blocks`

_Get block information by specifying either a hexadecimal block number or a block hash._

<h3 id="get__api_blocks-parameters">Parameters</h3>

| Name      | In    | Type   | Required | Description                                                                                                                                                  |
| --------- | ----- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| numberHex | query | string | false    | A hexadecimal representation of the block number. Use "latest" or "earliest" to fetch the corresponding block, or provide a hex string for a specific block. |
| hash      | query | string | false    | The block hash. Also accepts "latest" or "earliest" to retrieve a block by tag.                                                                              |

> Example responses

> 200 Response

```json
{
  "cycle": 1,
  "hash": "0x8b26655f1239d9fd55ec74550161bb0cb0787cf01205c206603770bb9152c708",
  "number": 10,
  "readableBlock": {
    "difficulty": "0x4ea3f27bc",
    "extraData": "0x476574682f4c5649562f76312e302e302f6c696e75782f676f312e342e32",
    "gasLimit": "0x4a817c800",
    "gasUsed": "0x0",
    "hash": "0x8b26655f1239d9fd55ec74550161bb0cb0787cf01205c206603770bb9152c708",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "miner": "0xbb7b8287f3f0a933474a79eae42cbca977791171",
    "mixHash": "0x4fffe9ae21f1c9e15207b1f472d5bbdd68c9595d461666602f2be20daf5e7843",
    "nonce": "0x689056015818adbe",
    "number": "0xa",
    "parentHash": "0xc90d104fdcf5d29d07cc9d97b04467633d4a9ce156a5fc9d3a9f9718434edde8",
    "receiptsRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "size": "0x220",
    "stateRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": "0x675bd48d",
    "totalDifficulty": "0x78ed983323d",
    "transactions": [],
    "transactionsRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "uncles": []
  },
  "success": true,
  "timestamp": 1734071437000
}
```

<h3 id="get__api_blocks-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [BlockResponse](#schemablockresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_v2_logs

`GET /api/v2/logs`

_Retrieve logs using filters for block range, address, and topics_

<h3 id="get__api_v2_logs-parameters">Parameters</h3>

| Name      | In    | Type   | Required | Description                                                                     |
| --------- | ----- | ------ | -------- | ------------------------------------------------------------------------------- |
| fromBlock | query | string | false    | Starting block number. Defaults to "earliest" if not provided.                  |
| toBlock   | query | string | false    | Ending block number. Defaults to "latest" if not provided.                      |
| address   | query | string | false    | Filters logs by address. Accepts a single address or a JSON array of addresses. |
| topics    | query | string | false    | Filters logs by topics. Expects a JSON array of topics.                         |

> Example responses

> 200 Response

```json
{
  "success": true,
  "logs": [{}]
}
```

<h3 id="get__api_v2_logs-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [LogResponse](#schemalogresponse)     |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

<aside class="success">
This operation does not require authentication
</aside>

## get__api_cycleinfo

`GET /api/cycleinfo`

_Get the current cycle information._

<h3 id="get__api_cycleinfo-parameters">Parameters</h3>

| Name        | In    | Type   | Required | Description                                                        |
| ----------- | ----- | ------ | -------- | ------------------------------------------------------------------ |
| cycleNumber | query | string | false    | The cycle number                                                   |
| count       | query | string | false    | The number of results to return.                                   |
| to          | query | string | false    | The ending block number for the cycle range.                       |
| from        | query | string | false    | The starting block number for the cycle range.                     |
| marker      | query | string | false    | A marker for pagination, used to retrieve the next set of results. |

> Example responses

> 200 Response

```json
{
  "cycles": [
    {
      "counter": 89510,
      "cycleMarker": "0d4e87e7949e06918770db7685e4ff120cf8f391ebf46be56f259f1388ec7b94",
      "cycleRecord": {
        "activated": [
          "9a3bebf5c5a8a30dd9ed282405cfa90ef54bc8bd378303e52cbba5289a116a05",
          "a9e11af7c9f9728ac6740ff3b74d788a5d6c4e985bc8160cde0c01d86f532760",
          "e5926cc147232fcc3ecf08735027963cfaea720d853ce56d4cb8fb6650c2ac67"
        ],
        "activatedPublicKeys": [
          "436d1a078226fa802bec75d1b2688a09e2c26434caf4ffed80b378c37f3bc213",
          "695c7ea5796590e227cb678b4d6e4fc16e4f6dd99359f593d9e97ed2d7fdd95f",
          "b570a921c89b390843e24d135d217aa41022c87efe5ac00939dbcc56639f07df"
        ],
        "active": 1275,
        "apoptosized": ["434804a8fbf41e05435785794c1331078f5fcd0ff66ce779c1f1e173447bd430"],
        "appRemoved": [],
        "archiverListHash": "84ba3f046eb3dfd3f08460b734b3cb75401aaf621341a4753fe802741872bf80",
        "counter": 89510,
        "desired": 1280,
        "duration": 60,
        "expired": 2,
        "finishedSyncing": [
          "04b2dfdb8a41e40820b9e814cdbe725c6032f5182474e608f22e6f287effb397",
          "10da7ce6936446df5d7a3595d8d69ba9342459a24dd6bdf472e8b758bdc3d928",
          "120607aaa744a58c818b098eac63afe13c5d9263a3ae2cbd97590921bf3f69cf",
          "82a004ae82e05c259d7b08a7126ca363e72c7abbf332132926a4ee04e0605eb1",
          "a727fde0b02f44969da991eb1097f64cc142a8b40c5c683988d10a8f05185462"
        ],
        "joined": [],
        "joinedArchivers": [],
        "joinedConsensors": [],
        "leavingArchivers": [],
        "lost": [
          "2b6bf02e52f7fcfe9c6e45077d020a47f61d35737542479075efa674644890c6",
          "3105e6ef940e2e36686bc8c3f685bd35f49cd821685c188f506315856f256a3b",
          "434804a8fbf41e05435785794c1331078f5fcd0ff66ce779c1f1e173447bd430",
          "4db7b58a508a55676695a50e3b0cad41bcdfe78c6800f4273cfdb020d65b6309",
          "5491056e10a2304fa21a721be170619d9232a6f4a2ece59b762e57fbf61d23be",
          "7d02826666d52995591d18e0d79a7e2fbd12c46fe7160816cdfc77b9a2b712e5",
          "93b5e37f2cfa9b64ba3c1f378a9bee5f4bea34851c689b945cd7cc9decab34a8",
          "971bf117a5d381c4132b2cf662e7399c63f742ae05e70a770c869d5699d4507a"
        ],
        "lostAfterSelection": [],
        "lostArchivers": [],
        "lostSyncing": [],
        "marker": "0d4e87e7949e06918770db7685e4ff120cf8f391ebf46be56f259f1388ec7b94",
        "maxSyncTime": 5040,
        "mode": "processing",
        "networkConfigHash": "2fef71e380e8c07a21020ceaae65e574022066d494045a73cef3da7347a86786",
        "networkId": "e68a77d2c59f7ed9559587ef731244ad381504c262e26bb061e435db32bc719e",
        "nodeListHash": "db01b299e5dbc7d95402a79e555eac3a3414a643c1bead8518af2e41778734a4",
        "previous": "1530afd176e1dfc63e7f23dd83a8728723c01bd0c8d842364bc4328f6076a97f",
        "random": 0,
        "refreshedArchivers": [],
        "refreshedConsensors": [],
        "refuted": [
          "262923b892022c77051d70b149463f2d57929ec9e5355e1945a987a9c3f7ef83",
          "2b6bf02e52f7fcfe9c6e45077d020a47f61d35737542479075efa674644890c6",
          "3105e6ef940e2e36686bc8c3f685bd35f49cd821685c188f506315856f256a3b",
          "4db7b58a508a55676695a50e3b0cad41bcdfe78c6800f4273cfdb020d65b6309",
          "5491056e10a2304fa21a721be170619d9232a6f4a2ece59b762e57fbf61d23be",
          "7d02826666d52995591d18e0d79a7e2fbd12c46fe7160816cdfc77b9a2b712e5",
          "93b5e37f2cfa9b64ba3c1f378a9bee5f4bea34851c689b945cd7cc9decab34a8",
          "971bf117a5d381c4132b2cf662e7399c63f742ae05e70a770c869d5699d4507a"
        ],
        "refutedArchivers": [],
        "removed": ["8f765ced845d032dfaefaa88c5c333aa02c71fed6c290395d1adc5f4878711a7"],
        "removedArchivers": [],
        "returned": [],
        "standby": 8760,
        "standbyAdd": [
          {
            "appJoinData": {
              "adminCert": null,
              "isAdminCertUnexpired": false,
              "stakeCert": {
                "certExp": 1739443556497,
                "nominator": "0x9106de97b09a376f541814d2368f9d4af58cc9d4",
                "nominee": "064eb302614737160997235251a79381dfca1d3958dadb3b07c14c2ef2dc6374",
                "signs": [
                  {
                    "owner": "da4c661c9a910998bc2f01ab9f431f844eef84510d1d8f1b73b8bbd4c7b9235a",
                    "sig": "f90f3855451940f4afc9be27341e9ba413e5d053ba9822a1963f0fbde8177f4729818cfbd53f680c6655a02e558d0bd30686c1250143dcc83258ac67397146038a77fe52b31d4e69621c420fb8870f274cc9741d4154b2e0dc7dea4587c8412f"
                  },
                  {
                    "owner": "84c876ab4af22748e4cf8ef60d4d4a68e2b0ae63168852da0c3499a6ddfceea0",
                    "sig": "e5753cd7cfc99d5a9ab654620d5d8e560c2c8abb9c0ed69bb5290b939f2e6cb20263008d42fc30f79afc0d55331db84963e3f2379b817c39bd44497f194d83018a77fe52b31d4e69621c420fb8870f274cc9741d4154b2e0dc7dea4587c8412f"
                  },
                  {
                    "owner": "81985d43811208040e57d3ef17b966a04636885aa44418d5701e2191a9b95aa6",
                    "sig": "e7adcc6dde67b183476f3c7431279de184ce8bfb54a74c2cb8332e471e3cc3e0974ce6de01bbdb2aa92e7899ee66302fe5446ad1b4e7aeaf8580ee74f260db038a77fe52b31d4e69621c420fb8870f274cc9741d4154b2e0dc7dea4587c8412f"
                  },
                  {
                    "owner": "60c28d809f9141fa071beb5b465cd1e480f963fcd56896dfdadb21b56bdd8ebf",
                    "sig": "79985fff64237ba95ff9e378d1a7ccf5463b7c15d76bdbbe821dc27d6addd63340cbec0c6b795a8f9022dde510a95ad5519e2118e8e4c114480088443c8b21088a77fe52b31d4e69621c420fb8870f274cc9741d4154b2e0dc7dea4587c8412f"
                  },
                  {
                    "owner": "ec13dd300e14d24e9ccd5b74c5adc71cdbb6e70e29d84957850ea494de1a1d64",
                    "sig": "87ad58b33ec3282b088a66863d47aa14430f0255ef0aa2226c009848af64ac6d5a68c12753cd760b9adcbf2f61f58587fbd634520c22444272019428dc157e028a77fe52b31d4e69621c420fb8870f274cc9741d4154b2e0dc7dea4587c8412f"
                  }
                ],
                "stake": { "dataType": "bi", "value": "3f514193abb840000" }
              },
              "version": "1.16.3"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "064eb302614737160997235251a79381dfca1d3958dadb3b07c14c2ef2dc6374",
              "externalIp": "149.50.107.44",
              "externalPort": 9001,
              "internalIp": "149.50.107.44",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441879,
              "publicKey": "064eb302614737160997235251a79381dfca1d3958dadb3b07c14c2ef2dc6374",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"2f961d861774e481a606ac77450b484fce4f113de40e86430e309ed9809cea83\",\"nonce\":\"0a3d0c7f5468f39333d0f83edf562842c6f3e943c009ee1df999816ac039d934\"}}",
            "selectionNum": "0b41d0550a944695894dfa58b4fec7905c83c8a39fd9f964579d5c0d46470243",
            "sign": {
              "owner": "064eb302614737160997235251a79381dfca1d3958dadb3b07c14c2ef2dc6374",
              "sig": "437bbbbd3cea32ea0aa5c2d718e84071ed6757bf1be377af1f1833418a3ff2f895bd02d1914c8c25697ee435880da6848d38d8a14effe89085555fbb6bc10c091524f7dbfa07f954ad0fc09cfe4e103e8c14b35bbc5a3ef4867896a19696f563"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": null,
              "isAdminCertUnexpired": false,
              "stakeCert": {
                "certExp": 1739443590014,
                "nominator": "0xa120943b9868e99d739b0ef8f6dc9364194a98c4",
                "nominee": "26b2e09d0a1ea3ec91e77d01a38dfab4faa825f19580b022455e5d25c68ae77a",
                "signs": [
                  {
                    "owner": "38080abc0329873929ac8e36927506886442ed23124a30b9d00c18bc3a7343f4",
                    "sig": "285c6224697d79de9ed7630c442e194f3eaf9d76955813772e7f88dbb9491673c6a61169a11f4eb37103b96069c83ca2531300ca4d833ffa6cc3013b191b000baab7355a304968d3718b1b0fb2c3839789d8e918c71257a58b5f76b009eac225"
                  },
                  {
                    "owner": "dc3b9a2cb7d13910b31b19a03cd08e64a688107a1d0c0b06dbd61288cac84391",
                    "sig": "f35db3c6cdf7748883d7f27bfcc7f567ade5a332f52778a131fc52c63e4df97729a0dda9168219b62788a6ff2d5d9a1efa88ce3c62b13aa596b38017f7f96500aab7355a304968d3718b1b0fb2c3839789d8e918c71257a58b5f76b009eac225"
                  },
                  {
                    "owner": "ed24bebb2cab27a178791d0596430dc093c647d5ecda40b101963cbc0a2c026a",
                    "sig": "208bc42380fe37c4ae180f3f163da8f07f841f57d8609b0286fdc4490151c941db2cd608c73eb98a0b492bd5ccda85daa48237ce9c748740f6111267e83f700aaab7355a304968d3718b1b0fb2c3839789d8e918c71257a58b5f76b009eac225"
                  },
                  {
                    "owner": "a0c7cfbf3139ca4ed8957f8aa3ccda69970a74698e0c5abf0e39a49091a19412",
                    "sig": "2dc6a299e05a5483f671834baf521d4e3da3a4e7d00149ac955a4d2327ab801a2f7b2789587c234d2219610a393862ce605275c96188f62886c242f2ddb99e07aab7355a304968d3718b1b0fb2c3839789d8e918c71257a58b5f76b009eac225"
                  },
                  {
                    "owner": "a31426ac3d0b9829b46535cc2c20165296efc7492b668bb89951e2f84f29ff02",
                    "sig": "a8b8642bf46eb41ae350f3f19f9b072ce4b326b729d2a71a15c7f12dff58a3ab2de422e9f727f9abc57f1d2280a569404500821d4ad9384bf19ff9577e8bee0faab7355a304968d3718b1b0fb2c3839789d8e918c71257a58b5f76b009eac225"
                  }
                ],
                "stake": { "dataType": "bi", "value": "d02ab486cedc0000" }
              },
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "26b2e09d0a1ea3ec91e77d01a38dfab4faa825f19580b022455e5d25c68ae77a",
              "externalIp": "84.247.184.115",
              "externalPort": 9001,
              "internalIp": "84.247.184.115",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441912,
              "publicKey": "26b2e09d0a1ea3ec91e77d01a38dfab4faa825f19580b022455e5d25c68ae77a",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"0dcdea33a2de8f8e94eb0c10fdca3df7c8007b6430dac728227d78c19bd6c38d\",\"nonce\":\"15257a3ff128e6eebc95998652bd0791a574159c33129717676cfed27eda38a4\"}}",
            "selectionNum": "1ddc115235a6683fded856eeb0cf3244ad1d2f31536dca8b33e72c2f81bdaa7e",
            "sign": {
              "owner": "26b2e09d0a1ea3ec91e77d01a38dfab4faa825f19580b022455e5d25c68ae77a",
              "sig": "786695e9c6fb2c5d6d3e4d9f5c6a378f95dabddf51a04b71b50d4ec8e9725c817c9dbb1f61a4cb07e193d6df5e0586b8d53f490f0efd279b7115e6d61c516004ac8f490f5e1b30a405c33968e4d8ef21c5500033736aa3b08093b5e3f3782ff2"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": {
                "certCreation": 1739441854921,
                "certExp": 1739528254912,
                "goldenTicket": true,
                "nominee": "29c48c9024ec54e0412faa46ed11acbde97686be8d03de77d86a7e3d6355efcb",
                "sign": {
                  "owner": "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9",
                  "sig": "1fb1133cbc4d542dd605b8773d8a37b4367227c3227ca6ffc3111adb09c147ac23cac9b3264220f392c2a7240a97516577946e81646404c4fc81016eaf0c90089150703a3cb2dda327254277d689535d66924dc52f6ba1a3b8accd7ccd5891aa"
                }
              },
              "isAdminCertUnexpired": true,
              "stakeCert": null,
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "29c48c9024ec54e0412faa46ed11acbde97686be8d03de77d86a7e3d6355efcb",
              "externalIp": "34.139.17.57",
              "externalPort": 9001,
              "internalIp": "34.139.17.57",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441873,
              "publicKey": "29c48c9024ec54e0412faa46ed11acbde97686be8d03de77d86a7e3d6355efcb",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"29275cd7c2d94a05c40928b5143839c9396b5578d700b1fef2b3d0d35444a029\",\"nonce\":\"60783e6a26286cec274fc2d954351ff51f002b49faa75473345f6c8d0cd1d127\"}}",
            "selectionNum": "6b2b5205efc6204af3d3618ba53c7353b26d50e9922c402b50cc698d8596d4e8",
            "sign": {
              "owner": "29c48c9024ec54e0412faa46ed11acbde97686be8d03de77d86a7e3d6355efcb",
              "sig": "70ea613e7f50f630a96c0429e71e4fabee60f6275a7ab573faeb442ec818fc1653b7e556b4c59ab43b0415207e26cf2e9675e5fc062b067e92dd7da0ee4a5e0e913801b38c0d45ccf2aad9dbcc53d476fd77dc80016e787932c874bcd9e92691"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": {
                "certCreation": 1739441854925,
                "certExp": 1739528254912,
                "goldenTicket": true,
                "nominee": "509924a65415bcef077eb1a5134ce63bdca10228d2fef3acef85636d825990a4",
                "sign": {
                  "owner": "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9",
                  "sig": "a03baf23cec0dece726195e597083b755ebba2df1000fb3d6fc8bc9d57423c3f6fc43987cb14a5cfc2ef55091f053e74ca7a9b819d60911456cf428924c59207e880206a74271d534a1e5564e98246032d90cd850f9d1731467635c5d97c7e22"
                }
              },
              "isAdminCertUnexpired": true,
              "stakeCert": null,
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "509924a65415bcef077eb1a5134ce63bdca10228d2fef3acef85636d825990a4",
              "externalIp": "35.243.194.228",
              "externalPort": 9001,
              "internalIp": "35.243.194.228",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441871,
              "publicKey": "509924a65415bcef077eb1a5134ce63bdca10228d2fef3acef85636d825990a4",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"1ea35f2be1b936ca5cace424d22acddd2ce70245bfc9c8a3482599a6b12a7fe9\",\"nonce\":\"b56f800c33ad0cc1c493951417708ae78c362a5f6bb34fd42ca9843e9a306d7c\"}}",
            "selectionNum": "6ce789f60777eb839710c73c6a30a48c031dda6e105b4f3d9b9ae0e46eac20bd",
            "sign": {
              "owner": "509924a65415bcef077eb1a5134ce63bdca10228d2fef3acef85636d825990a4",
              "sig": "aa931b16c81b2980ee5f63829fbfcaacf754d4260daa951cf207834fb2ccc42ef0d4bb4fa474400285950739eb2d5dea60b4a0327c5c1d96b2e17f731644970e84cdd65ca618a9c71bdde603075a0979a92c7d97ff9f99b40ff55ac330044a84"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": {
                "certCreation": 1739441854925,
                "certExp": 1739528254912,
                "goldenTicket": true,
                "nominee": "7624f395a550eeec54efc115bcf23213095c1fbda15ba9db7724e4af538a74ac",
                "sign": {
                  "owner": "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9",
                  "sig": "a0f66160785619489c0fb8eebf00504692cf38eb25dd90ab4cdd4a25109e0a2d4da4fd8adf7bc60bcd26d9a79d0ca29501d50a68267ebd7d003c102a1a0e7d07355fd9e9cd63b4e01879d08aff6336ccb6abba6ece471718092323c33d39fc9f"
                }
              },
              "isAdminCertUnexpired": true,
              "stakeCert": null,
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "7624f395a550eeec54efc115bcf23213095c1fbda15ba9db7724e4af538a74ac",
              "externalIp": "35.237.83.163",
              "externalPort": 9001,
              "internalIp": "35.237.83.163",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441873,
              "publicKey": "7624f395a550eeec54efc115bcf23213095c1fbda15ba9db7724e4af538a74ac",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"3b7beaa9b7002961fb452b83fd52a81a932baf65de7107e0929aec7f5781c811\",\"nonce\":\"315f6f5feeb4352f486bf5cb091b8206f46e6c1950522bdc9a5b1a8aef972fe9\"}}",
            "selectionNum": "da81a274b90381ae70f078000799edb66a484354e0e2ed6d52984fbd0f8bcb45",
            "sign": {
              "owner": "7624f395a550eeec54efc115bcf23213095c1fbda15ba9db7724e4af538a74ac",
              "sig": "7f1d5c589b234ffe5c996f5783766e1d37b74e055dcc1b8ee99ca9b145fbf8a1aa8318d7c9fd032f7d56e8e679a7e28d4ec7ffe8bc4dc6e905b514d0d8ec7e02c17f1f72aa11767b5a64433a5f7ef50a922eda8c9f568258e5a6542edd12e308"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": {
                "certCreation": 1739441854922,
                "certExp": 1739528254912,
                "goldenTicket": true,
                "nominee": "8761b5da5918889eddb77da46dbad3e74d3f65df7fa2eec9668b390fdce1bd8d",
                "sign": {
                  "owner": "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9",
                  "sig": "fe7bcc96d0345b116c5032069b63c3c365400a5e45b5d66679e600fb1d910260efd6713350f09f37402b131214a949bd253cc81ae29aa7044b0ffddcd793f907203750fb2b220d95285125d44d6a16383609e743c66666238748dd6473407b4a"
                }
              },
              "isAdminCertUnexpired": true,
              "stakeCert": null,
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "8761b5da5918889eddb77da46dbad3e74d3f65df7fa2eec9668b390fdce1bd8d",
              "externalIp": "34.139.163.234",
              "externalPort": 9001,
              "internalIp": "34.139.163.234",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441872,
              "publicKey": "8761b5da5918889eddb77da46dbad3e74d3f65df7fa2eec9668b390fdce1bd8d",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"2f1bb6d4b377e7313b432591000f5579bb9ddbb5490ac0dcaf2d31c7b225b78d\",\"nonce\":\"5ecded050732ed5e71d7393cd296f12a370c5dc4f5ac064bdfafcd9e6fb4963b\"}}",
            "selectionNum": "07eec2aaea9036d6eb8d8b3779658ffbb037588a74ebaad0fe41a135ef18e5e5",
            "sign": {
              "owner": "8761b5da5918889eddb77da46dbad3e74d3f65df7fa2eec9668b390fdce1bd8d",
              "sig": "8246db4ca339d8b5d793a825b0b6eda1ab699f2f527ede326cf658b5292f46e5fee84b27c0cbaf7787ec4364f8b5314cfe63dfc62e032c48c5163a43792ed205a3726a8eb1529dc7a4a32eb07212ffa1e14ed777cf130c8671d5df1f9fe843e9"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": null,
              "isAdminCertUnexpired": false,
              "stakeCert": {
                "certExp": 1739443545765,
                "nominator": "0x245bf9caa2d908a4ac62032137491c8c56f033ae",
                "nominee": "a3f7746f548f6af9f7b55d4b5cf2f9c674bb333cee0cb00fcefbc7a144be4c01",
                "signs": [
                  {
                    "owner": "7d4099fb5358c68909a939f25301b8600e2a4ffa7a4ee1e1e3343d9fe53862ff",
                    "sig": "fc23971dd3929b43f160df409413f272d3d3262c2c796b6d89d81d6432b6ac20cc895eafc4cde013c506f060227df08ed6119267cec34b2adadca20496bb85022dee5c1cfb580ea5680e16ca3b447b9eb973d80b81e393eb7974a9bab9b6f0f3"
                  },
                  {
                    "owner": "4234fbba88670fed6d5d7cac4fa3a5cb9978c3156b8229b17eb7383cd66c8880",
                    "sig": "a199c1c42c1a56d35111064aefb7f1bb78ddf2c06598081178ec6722f7cf6568dd852438bfdc88618ca72c8e79665ee7f6dd44c1148ad8f66b6274c9023f79062dee5c1cfb580ea5680e16ca3b447b9eb973d80b81e393eb7974a9bab9b6f0f3"
                  },
                  {
                    "owner": "c364eb088913df7a34bedaf20a1cbea405641cb006dd17eef251071b53c1f690",
                    "sig": "d3661e2483a8f914592bda1492061e63c480e8a765185953e07496ff999e66a84f825b440b968234c13035f236987dc36ca686ea525f4cc1b1cedd5c1ae6a60e2dee5c1cfb580ea5680e16ca3b447b9eb973d80b81e393eb7974a9bab9b6f0f3"
                  },
                  {
                    "owner": "339b0d7a32fdf1000ea67e0334eab19062cb9e4d7d8740748e04bf7436445eda",
                    "sig": "758a02d325caa9407b21eae916621919e10d7c908c9b1dbc8ea9fb0fa75a9fadc6188bb2e25976774acf5cc1c514852616817e100918792968f154096b9a9b0e2dee5c1cfb580ea5680e16ca3b447b9eb973d80b81e393eb7974a9bab9b6f0f3"
                  },
                  {
                    "owner": "864d1f9e401956149968c71fa417c3093e06e2b00b70213d4d99e9108de920fd",
                    "sig": "2500dc505eae13e43e731d16cb28f6c614adf28e717706409a1b314c4293f03a83636bb8f329c799e13ed17ac284ddeef146bc68668e92ebd8d29892f82ca9022dee5c1cfb580ea5680e16ca3b447b9eb973d80b81e393eb7974a9bab9b6f0f3"
                  }
                ],
                "stake": { "dataType": "bi", "value": "3cb71f51fc5580000" }
              },
              "version": "1.16.3"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "a3f7746f548f6af9f7b55d4b5cf2f9c674bb333cee0cb00fcefbc7a144be4c01",
              "externalIp": "159.89.201.172",
              "externalPort": 9001,
              "internalIp": "159.89.201.172",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441870,
              "publicKey": "a3f7746f548f6af9f7b55d4b5cf2f9c674bb333cee0cb00fcefbc7a144be4c01",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"3b63f757ac94f2c6a1dff4681093b06e04ec393ca64be0f53bb651ba7b48ab83\",\"nonce\":\"b840f685b439716b65b5d2c2422725a1a101b17acc78c37ef52c7022c7f893d3\"}}",
            "selectionNum": "d1aa103d9185a9333b21f1cc63dfd89834e145a6dbd63ee7ef7ac57ff77325fa",
            "sign": {
              "owner": "a3f7746f548f6af9f7b55d4b5cf2f9c674bb333cee0cb00fcefbc7a144be4c01",
              "sig": "63e93759a1a72b526c6b6f34994e7c131939670f573fd7a682e7d2a599a3e5d8f5753d9299804e559a89df1742da73dd0292c02e5083dc1707b1febaff21b401795af00548b06bf582a599eb6fa2125594894fbdf6ba0c8c464696e180a71aa3"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": null,
              "isAdminCertUnexpired": false,
              "stakeCert": {
                "certExp": 1739443575519,
                "nominator": "0xf5580e9bf6f739c7000a92cbb17790340efce41a",
                "nominee": "ab7f86379f14d19ca0b3eabdf32afd0666bb2d1f3fb2abe52d52cd27ad957382",
                "signs": [
                  {
                    "owner": "884da78e42024e778e181fabba41be54f147b25d34ca2a1c9dff5d51e4c132c6",
                    "sig": "4a7fd66aca5bfb35b0f93942c664e9163181ba236ed9bb664899d810e97eee0354c01a389608ac6996cb8d14eb5902913d90d0f8c50997f31c9a0a0ce556f706eae31fa10b1563d0e0a0c5720fda885c99b49163c72a0bfb4d321a20fe61cfdd"
                  },
                  {
                    "owner": "20c56c52583bf3e6ce5d54596b996b72654b8c6e4ceb644a3829431825f12a65",
                    "sig": "3eac35e1d66b2f0a26162b40e47356f1c8105b895f90e00f137e44592930044b8146770c0b295251572f62bb14798f098a14dd5c440988c3c8658192efc7ff0aeae31fa10b1563d0e0a0c5720fda885c99b49163c72a0bfb4d321a20fe61cfdd"
                  },
                  {
                    "owner": "22001a2f15699308427cc5de9e72d1d91f12cc2e3ff861994ab03bc652f8d3cf",
                    "sig": "c9da474df18a871d9e07cc4f19a4f3dae25cbc85605703a8003eda1fca0c654fd22e86456b42bef5acbb7b9b7e01fb6aa404a6a72173cd7c81caaeeb46c26505eae31fa10b1563d0e0a0c5720fda885c99b49163c72a0bfb4d321a20fe61cfdd"
                  },
                  {
                    "owner": "1a0cf8112d387ea8885b3d7713c76f66b0367318ad2b997616a55eac73843c06",
                    "sig": "69608665978b2238f8bb44f1b11dfe16f2a5e503c8552e8e811fd2d9e45669b3f708bdfe1efa1844cc34b5b1539fc56a737a82d5db27677632b8092b18d23407eae31fa10b1563d0e0a0c5720fda885c99b49163c72a0bfb4d321a20fe61cfdd"
                  },
                  {
                    "owner": "9858a7978848dbe978c62099f13d945b20a6f8718db569ec20303bb33f889e26",
                    "sig": "b2eba345d4029477096a85154f6042f75f464976a336b78c93fa232e047bab3b0a35f1af4571e808d040116a5161124ccf1f6579ea5359f613d3e26c7e3f3402eae31fa10b1563d0e0a0c5720fda885c99b49163c72a0bfb4d321a20fe61cfdd"
                  }
                ],
                "stake": { "dataType": "bi", "value": "9a0b1f308ed60000" }
              },
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "ab7f86379f14d19ca0b3eabdf32afd0666bb2d1f3fb2abe52d52cd27ad957382",
              "externalIp": "184.174.37.33",
              "externalPort": 9001,
              "internalIp": "184.174.37.33",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441898,
              "publicKey": "ab7f86379f14d19ca0b3eabdf32afd0666bb2d1f3fb2abe52d52cd27ad957382",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"3965247eab1f9d8dc7a649461e59821e5c6974ec671f77b3ab003f5441d8d2df\",\"nonce\":\"7b3d9a094a86f4929bce9a8b5fe76db2b00dec04737636b42aacf7ec3cbc8769\"}}",
            "selectionNum": "9dff63ee1c1a4ac8e4a35fa240543a6c5b0a315809676c7b0bfe3136e0133f99",
            "sign": {
              "owner": "ab7f86379f14d19ca0b3eabdf32afd0666bb2d1f3fb2abe52d52cd27ad957382",
              "sig": "d3812fcecea1f3b919674a4b64544c701240e72e186c27118a9f8b76c780c07cddd178818b45acbe4460d3f9a6bcb4063f444dfbb90091034e47f1cdaa02be0c7dddf90c825e4943a6ad8e0614a82284985aad04f61e22cc31a1f87c0b18d699"
            },
            "version": "2.13.4-0"
          },
          {
            "appJoinData": {
              "adminCert": {
                "certCreation": 1739441854921,
                "certExp": 1739528254912,
                "goldenTicket": true,
                "nominee": "f3eeb4a96b59338eb0fb45ac2f3294ed0c2cff9cd2acab0d5959cb1b3f67bad6",
                "sign": {
                  "owner": "1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9",
                  "sig": "091af20f64dc4a6f90ed4c42a6bf8d5aa6b00484939f6ca04991607f2f264ef896ce5c3bed1fe0203621a9835c07f0e889a3fd9f5354a37528c9291041e9e809b6e5bd032942f18f58eac8ab3797901d11cbfd52307f5677b8c1d6e3349f6dc6"
                }
              },
              "isAdminCertUnexpired": true,
              "stakeCert": null,
              "version": "1.16.4"
            },
            "cycleMarker": "4a6494644297a4e0ee5b796ae6a7207423bf025bc16644a41f90eda13ed33afd",
            "nodeInfo": {
              "activeCycle": 0,
              "activeTimestamp": 0,
              "address": "f3eeb4a96b59338eb0fb45ac2f3294ed0c2cff9cd2acab0d5959cb1b3f67bad6",
              "externalIp": "34.73.55.141",
              "externalPort": 9001,
              "internalIp": "34.73.55.141",
              "internalPort": 10001,
              "joinRequestTimestamp": 1739441873,
              "publicKey": "f3eeb4a96b59338eb0fb45ac2f3294ed0c2cff9cd2acab0d5959cb1b3f67bad6",
              "readyTimestamp": 0,
              "refreshedCounter": 89507,
              "syncingTimestamp": 0
            },
            "proofOfWork": "{\"compute\":{\"hash\":\"312d263c6e8398df8c14fa16324eb7d5316b0f6a484f4d5eec765a68237e336b\",\"nonce\":\"0c3d22bb503b48e2c796a8bde703514fb68f8c6b45a3fa2dc300cdedb34ce0b0\"}}",
            "selectionNum": "3cac1f21a3dbff54d6321d4a7d990edbbea560b14088389e0ef7553d2313b748",
            "sign": {
              "owner": "f3eeb4a96b59338eb0fb45ac2f3294ed0c2cff9cd2acab0d5959cb1b3f67bad6",
              "sig": "cb3fcde075355a3c748391a220fa0123ca03b2c0bcfb4768e6faa5186fadfb3f8f7ccfdea2e30accdefbb4a9fab4ee16aa4392723b57ae2ceb648c08c7088e0dc7501e7945176c029ce2d01f4f489ea461567db1436ef56cb9b9de27ba3d554f"
            },
            "version": "2.13.4-0"
          }
        ],
        "standbyNodeListHash": "62d49723b866a24698fbbab0b0860c927295d7418b943562a2c21a12e637abc0",
        "standbyRefresh": [],
        "standbyRemove": [
          "02006eff83dd4f47b30a57388bd22e12ede54805242d79ee8542005f400e1a03",
          "0619df2de6d9da1d6fd0e49c55a884e7bd32ba683d23207cfcaa564bf8080fb4",
          "828d29d079ed92520fda7bafc22d278e4ce423d1c7eacc8b549e50c85a89b4ba",
          "c780aff19aa51f17183fff99a788155234f95740845f708f92315b9d4899c48c"
        ],
        "start": 1739441977,
        "startedSyncing": [],
        "syncing": 55,
        "target": 1280,
        "txadd": [
          {
            "cycle": 89510,
            "hash": "32150acbeb1b7d267f5f890a3f62e797e7a81115bfa876e4d2563220045a72be",
            "priority": 0,
            "subQueueKey": "d29ebaf20031c8751b87898b03447abd1d4dd110f67582c695039aa7fd0893bc",
            "txData": {
              "end": 89509,
              "endTime": 1739441917,
              "nodeId": "cbdb97daa35f1b7a394aa16e52fc50fd08c6874a23c4a0a8ffde4d22c7284d8a",
              "publicKey": "d29ebaf20031c8751b87898b03447abd1d4dd110f67582c695039aa7fd0893bc",
              "start": 89344
            },
            "type": "nodeReward"
          },
          {
            "cycle": 89510,
            "hash": "858ca5597aa08a1749fd367056e5bbe22e0cec6d5e0f1a191a46f7609865c9a6",
            "priority": 0,
            "subQueueKey": "1b523f09fa6d3b746222a98836806709f7f6281019682c73c98619cc45db9955",
            "txData": {
              "end": 89509,
              "endTime": 1739441917,
              "nodeId": "5f9fd0744d86f3ecc84fa6919c528bfdcd94e94ec3dda33f9bf2c3b2daa04471",
              "publicKey": "1b523f09fa6d3b746222a98836806709f7f6281019682c73c98619cc45db9955",
              "start": 89456
            },
            "type": "nodeReward"
          }
        ],
        "txlisthash": "a79c8c611c93a3b43377c7d7f7e4e944eff441a0cc2461c3c8d4fb1986795ed5",
        "txremove": []
      }
    }
  ],
  "success": true
}
```

<h3 id="get__api_cycleinfo-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                    |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [CycleInfoResponse](#schemacycleresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)     |

<aside class="success">
This operation does not require authentication.
</aside>

## get__port

`GET /port`

_Retrieve the collector server port._

> Example responses

> 200 Response

```json
{
  "port": 6001
}
```

<h3 id="get__api_port-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [PortResponse](#schemaportresponse)   |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

<aside class="success">
This operation does not require authentication.
</aside>

## get\_\_is_alive

`GET /is-alive`

_Check if the collector server is alive._

> Example responses

> 200 Response

```
OK
```

<h3 id="get__api_is-alive-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                    |
| ------ | ---------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [IsAliveResponse](#schemaisaliveresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)     |

<aside class="success">
This operation does not require authentication.
</aside>

## get\_\_is_healthy

`GET /is-healthy`

_Assess if the collector server is healthy._

> Example responses

> 200 Response

```json
{
  "status": "healthy",
  "uptime": 70323.048539439,
  "timestamp": "2025-02-13T06:49:25.487Z",
  "database": true,
  "shardeumIndexerDb": true
}
```

<h3 id="get__api_is-healthy-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                        |
| ------ | ---------------------------------------------------------------- | ------------------- | --------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [IsHealthyResponse](#schemaishealthyresponse) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse)         |

<aside class="success">
This operation does not require authentication.
</aside>

# Schemas

<h2 id="tocS_AccountResponse">AccountResponse</h2>
<!-- backwards compatibility -->
<a id="schemaaccountresponse"></a>
<a id="schema_AccountResponse"></a>
<a id="tocSaccountresponse"></a>
<a id="tocsaccountresponse"></a>

Example:

```JSON
{
  "success": true,
  "accounts": [],
  "totalPages": 0,
  "totalAccounts": 0,
  "totalContracts": 0
}
```

### Properties

| Name           | Type    | Required | Restrictions | Description                                |
| -------------- | ------- | -------- | ------------ | ------------------------------------------ |
| success        | boolean | false    | none         | Indicates if the operation was successful. |
| accounts       | array   | false    | none         | List of account objects.                   |
| totalPages     | integer | false    | none         | Total number of available pages.           |
| totalAccounts  | integer | false    | none         | Total number of accounts returned.         |
| totalContracts | integer | false    | none         | Total number of contracts included.        |

<h2 id="tocS_TokenResponse">TokenResponse</h2>
<!-- backwards compatibility -->
<a id="schematokenresponse"></a>
<a id="schema_TokenResponse"></a>
<a id="tocStokenresponse"></a>
<a id="tocstokenresponse"></a>

Example:

```json
{
  "success": true,
  "tokens": [],
  "totalPages": 0,
  "totalTokenHolders": 0
}
```

### Properties

| Name              | Type    | Required | Restrictions | Description                                |
| ----------------- | ------- | -------- | ------------ | ------------------------------------------ |
| success           | boolean | false    | none         | Indicates if the operation was successful. |
| tokens            | array   | false    | none         | List of token objects.                     |
| totalPages        | integer | false    | none         | Total number of available pages.           |
| totalTokenHolders | integer | false    | none         | Total number of token holders.             |

<h2 id="tocS_TransactionResponse">TransactionResponse</h2>
<!-- backwards compatibility -->
<a id="schematransactionresponse"></a>
<a id="schema_TransactionResponse"></a>
<a id="tocStransactionresponse"></a>
<a id="tocstransactionresponse"></a>

Example:

```json
{
  "success": true,
  "transactions": [],
  "totalPages": 0,
  "totalTransactions": 0,
  "totalStakeTxs": 0,
  "totalRewardTxs": 0,
  "totalUnstakeTxs": 0,
  "filterAddressTokenBalance": 0
}
```

### Properties

| Name                      | Type    | Required | Restrictions | Description                                            |
| ------------------------- | ------- | -------- | ------------ | ------------------------------------------------------ |
| success                   | boolean | false    | none         | Indicates if the operation was successful.             |
| transactions              | array   | false    | none         | List of transaction objects.                           |
| totalPages                | integer | false    | none         | Total number of available pages.                       |
| totalTransactions         | integer | false    | none         | Total number of transactions returned.                 |
| totalStakeTxs             | integer | false    | none         | Total number of stake transactions.                    |
| totalRewardTxs            | integer | false    | none         | Total number of reward transactions.                   |
| totalUnstakeTxs           | integer | false    | none         | Total number of unstake transactions.                  |
| filterAddressTokenBalance | number  | false    | none         | Token balance for the filtered address, if applicable. |

<h2 id="tocS_MetricsResponse">MetricsResponse</h2>
<!-- backwards compatibility -->
<a id="schemametricsresponse"></a>
<a id="schema_MetricsResponse"></a>
<a id="tocSmetricsresponse"></a>
<a id="tocsmetricsresponse"></a>

Example:

```json
{
  "enabled": true,
  "enabledAt": "",
  "enableForInMinutes": 0,
  "usage": {},
  "errors": {}
}
```

### Properties

| Name    | Type    | Required | Restrictions | Description                                |
| ------- | ------- | -------- | ------------ | ------------------------------------------ |
| success | boolean | false    | none         | Indicates if the operation was successful. |
| metrics | object  | false    | none         | Object containing various metric values.   |

<h2 id="tocS_ReceiptResponse">ReceiptResponse</h2>
<!-- backwards compatibility -->
<a id="schemareceiptresponse"></a>
<a id="schema_ReceiptResponse"></a>
<a id="tocSreceiptresponse"></a>
<a id="tocsreceiptresponse"></a>

Example:

```json
{
  "success": true,
  "receipts": []
}
```

### Properties

| Name          | Type    | Required | Restrictions | Description                                |
| ------------- | ------- | -------- | ------------ | ------------------------------------------ |
| success       | boolean | false    | none         | Indicates if the operation was successful. |
| receipts      | array   | false    | none         | List of receipt objects.                   |
| totalPages    | integer | false    | none         | Total number of available pages.           |
| totalReceipts | integer | false    | none         | Total number of receipts returned.         |

<h2 id="tocS_OriginalTxResponse">OriginalTxResponse</h2>
<!-- backwards compatibility -->
<a id="schemaoriginaltxresponse"></a>
<a id="schema_OriginalTxResponse"></a>
<a id="tocSoriginaltxresponse"></a>
<a id="tocsoriginaltxresponse"></a>

Example:

```json
{
  "success": true,
  "originalTxs": [],
  "totalPages": 0,
  "totalOriginalTxs": 0
}
```

### Properties

| Name             | Type    | Required | Restrictions | Description                                      |
| ---------------- | ------- | -------- | ------------ | ------------------------------------------------ |
| success          | boolean | false    | none         | Indicates if the operation was successful.       |
| originalTxs      | array   | false    | none         | List of original transaction objects or a count. |
| totalPages       | integer | false    | none         | Total number of available pages.                 |
| totalOriginalTxs | integer | false    | none         | Total number of original transactions returned.  |

<h2 id="tocS_LogResponse">LogResponse</h2>
<!-- backwards compatibility -->
<a id="schemalogresponse"></a>
<a id="schema_LogResponse"></a>
<a id="tocSlogresponse"></a>
<a id="tocslogresponse"></a>

Example:

```json
{
  "success": true,
  "logs": [{}]
}
```

### Properties

| Name       | Type    | Required | Restrictions | Description                                |
| ---------- | ------- | -------- | ------------ | ------------------------------------------ |
| success    | boolean | false    | none         | Indicates if the operation was successful. |
| logs       | array   | false    | none         | List of log objects.                       |
| totalPages | integer | false    | none         | Total number of available pages.           |
| totalLogs  | integer | false    | none         | Total number of logs returned.             |

<h2 id="tocS_TotalDataResponse">TotalDataResponse</h2>
<!-- backwards compatibility -->
<a id="schematotaldataresponse"></a>
<a id="schema_TotalDataResponse"></a>
<a id="tocStotaldataresponse"></a>
<a id="tocstotaldataresponse"></a>

Example:

```json
{
  "success": true,
  "totalData": {}
}
```

### Properties

| Name      | Type    | Required | Restrictions | Description                                     |
| --------- | ------- | -------- | ------------ | ----------------------------------------------- |
| success   | boolean | false    | none         | Indicates if the operation was successful.      |
| totalData | object  | false    | none         | Object containing aggregated total data values. |

<h2 id="tocS_BlockResponse">BlockResponse</h2>
<!-- backwards compatibility -->
<a id="schemablockresponse"></a>
<a id="schema_BlockResponse"></a>
<a id="tocSblockresponse"></a>
<a id="tocsblockresponse"></a>

Example:

```json
{
  "success": true,
  "block": {}
}
```

### Properties

| Name    | Type    | Required | Restrictions | Description                                |
| ------- | ------- | -------- | ------------ | ------------------------------------------ |
| success | boolean | false    | none         | Indicates if the operation was successful. |
| error   | string  | false    | none         | Error message describing what went wrong.  |

<h2 id="tocS_CycleInfoResponse">CycleInfoResponse</h2>
<!-- backwards compatibility -->
<a id="schemacycleresponse"></a>
<a id="schema_CycleInfoResponse"></a>
<a id="tocScycleresponse"></a>
<a id="tocscycleresponse"></a>

Example:

```json
{
  "success": true,
  "cycles": []
}
```

### Properties

| Name    | Type    | Required | Restrictions | Description                                |
| ------- | ------- | -------- | ------------ | ------------------------------------------ |
| success | boolean | false    | none         | Indicates if the operation was successful. |
| cycles  | array   | false    | none         | List of cycle objects.                     |

<h2 id="tocS_PortResponse">PortResponse</h2>
<!-- backwards compatibility -->
<a id="schemaportresponse"></a>
<a id="schema_PortResponse"></a>
<a id="tocSportresponse"></a>
<a id="tocsportresponse"></a>

Example:

```json
{
  "port": 8080
}
```

### Properties

| Name | Type    | Required | Restrictions | Description                          |
| ---- | ------- | -------- | ------------ | ------------------------------------ |
| port | integer | false    | none         | Port number of the collector server. |

<h2 id="tocS_IsAliveResponse">IsAliveResponse</h2>
<!-- backwards compatibility -->
<a id="schemaisaliveresponse"></a>
<a id="schema_IsAliveResponse"></a>
<a id="tocSisaliveresponse"></a>
<a id="tocsisaliveresponse"></a>

Example:

```
OK
```

### Properties

| Name | Type   | Required | Restrictions | Description                       |
| ---- | ------ | -------- | ------------ | --------------------------------- |
| OKAY | string | false    | none         | Indicates if server is reachable. |

<h2 id="tocS_IsHealthyResponse">IsHealthyResponse</h2>
<!-- backwards compatibility -->
<a id="schemaishealthyresponse"></a>
<a id="schema_IsHealthyResponse"></a>
<a id="tocSishealthyresponse"></a>
<a id="tocsishealthyresponse"></a>

Example:

```json
{
  "status": "healthy",
  "uptime": 70323.048539439,
  "timestamp": "2025-02-13T06:49:25.487Z",
  "database": true,
  "shardeumIndexerDb": true
}
```

### Properties

| Name              | Type    | Required | Restrictions | Description                                 |
| ----------------- | ------- | -------- | ------------ | ------------------------------------------- |
| status            | string  | false    | none         | Health status of the server.                |
| uptime            | number  | false    | none         | Uptime of the server in seconds.            |
| timestamp         | boolean | false    | none         | Indicates date and time.                    |
| database          | boolean | false    | none         | Indicates if the server is connected to db. |
| shardeumIndexerDb | boolean | false    | none         | Indicates if indexing on db is enabled.     |

<h2 id="tocS_ErrorResponse">ErrorResponse</h2>
<!-- backwards compatibility -->
<a id="schemaerrorresponse"></a>
<a id="schema_ErrorResponse"></a>
<a id="tocSerrorresponse"></a>
<a id="tocserrorresponse"></a>

Example:

```json
{
  "success": false,
  "error": "ERROR_MESSAGE_STRING"
}
```