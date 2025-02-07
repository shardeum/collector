---
title: 'Shardeum Collector API'
---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="collector-api">Shardeum Collector API</h1>

## get__api_account

`GET /api/account`

_Get account information_

<h3 id="get__api_account-parameters">Parameters</h3>

| Name        | In    | Type    | Required | Description                                                                                                                |
| ----------- | ----- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| count       | query | integer | false    | Number of accounts to retrieve (maximum 1000).                                                                             |
| page        | query | integer | false    | Page number for paginated results.                                                                                         |
| address     | query | string  | false    | Account address to retrieve.                                                                                               |
| type        | query | integer | false    | Filter accounts by type. To extract contract accounts list (type=contract); otherwise, all account types will be returned. |
| accountType | query | integer | false    | Specific account type to filter when querying by address.                                                                  |
| startCycle  | query | integer | false    | Starting cycle number for filtering accounts.                                                                              |
| endCycle    | query | integer | false    | Ending cycle number for filtering accounts.                                                                                |
| accountId   | query | string  | false    | Account ID to retrieve (must be 64 characters).                                                                            |
| blockNumber | query | integer | false    | Block number for historical account state retrieval.                                                                       |
| blockHash   | query | string  | false    | Block hash for historical account state retrieval.                                                                         |

> Example responses

> 200 Response

```json
{
  "success": true,
  "accounts": [{}],
  "totalPages": 0,
  "totalAccounts": 0,
  "totalContracts": 0
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

| Name            | In    | Type    | Required | Description                                                               |
| --------------- | ----- | ------- | -------- | ------------------------------------------------------------------------- |
| count           | query | integer | false    | Number of transactions to retrieve (maximum 1000).                        |
| page            | query | integer | false    | Page number for paginated results.                                        |
| txHash          | query | string  | false    | Transaction hash to query (must be 66 characters).                        |
| address         | query | string  | false    | Account address to filter transactions (42 or 64 characters).             |
| token           | query | string  | false    | Token address for additional filtering.                                   |
| filterAddress   | query | string  | false    | Secondary filter for token balance (must be 42 characters).               |
| txType          | query | integer | false    | Transaction type filter.                                                  |
| startCycle      | query | integer | false    | Starting cycle number for transaction query.                              |
| endCycle        | query | integer | false    | Ending cycle number for transaction query (max range of 100 cycles).      |
| txId            | query | string  | false    | Unique transaction identifier.                                            |
| type            | query | string  | false    | Additional flag; set to "requery" to force a fresh database lookup.       |
| totalStakeData  | query | boolean | false    | Set "true" to retrieve total stake and unstake transaction data.          |
| beforeTimestamp | query | integer | false    | Filter transactions with a timestamp before this value (in milliseconds). |
| afterTimestamp  | query | integer | false    | Filter transactions with a timestamp after this value (in milliseconds).  |
| blockNumber     | query | integer | false    | Block number for historical transaction retrieval (non-negative).         |
| blockHash       | query | string  | false    | Block hash for historical transaction retrieval (must be 66 characters).  |

> Example responses

> 200 Response

```json
{
  "success": true,
  "transactions": [{}],
  "totalPages": 0,
  "totalStakeTxs": 0,
  "totalRewardTxs": 0,
  "totalUnstakeTxs": 0,
  "totalTransactions": 0,
  "filterAddressTokenBalance": 0
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
  "success": true,
  "metrics": {}
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

| Name       | In    | Type    | Required | Description                                   |
| ---------- | ----- | ------- | -------- | --------------------------------------------- |
| count      | query | integer | false    | Number of receipts to retrieve (maximum 1000) |
| page       | query | integer | false    | Page number for pagination                    |
| txId       | query | string  | false    | Transaction ID to retrieve a specific receipt |
| startCycle | query | integer | false    | Starting cycle number for filtering receipts  |
| endCycle   | query | integer | false    | Ending cycle number for filtering receipts    |

> Example responses

> 200 Response

```json
{
  "success": true,
  "receipts": []
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

| Name       | In    | Type    | Required | Description                                                  |
| ---------- | ----- | ------- | -------- | ------------------------------------------------------------ |
| count      | query | integer | false    | Number of original transactions to retrieve (maximum 1000)   |
| page       | query | integer | false    | Page number for pagination                                   |
| txId       | query | string  | false    | Transaction ID to retrieve a specific original transaction   |
| txHash     | query | string  | false    | Transaction hash to retrieve a specific original transaction |
| startCycle | query | integer | false    | Starting cycle number for filtering original transactions    |
| endCycle   | query | integer | false    | Ending cycle number for filtering original transactions      |
| decode     | query | string  | false    | Whether to decode the EVM raw transaction data               |
| pending    | query | string  | false    | Filter for pending transactions                              |

> Example responses

> 200 Response

```json
{
  "success": true,
  "originalTxs": [],
  "totalOriginalTxs": 0,
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

| Name      | In    | Type    | Required | Description                               |
| --------- | ----- | ------- | -------- | ----------------------------------------- |
| count     | query | integer | false    | Number of logs to retrieve (maximum 1000) |
| page      | query | integer | false    | Page number for pagination                |
| address   | query | string  | false    | Filter logs by address                    |
| topic0    | query | string  | false    | First topic filter                        |
| topic1    | query | string  | false    | Second topic filter                       |
| topic2    | query | string  | false    | Third topic filter                        |
| topic3    | query | string  | false    | Fourth topic filter                       |
| type      | query | string  | false    | Filter for transaction type               |
| fromBlock | query | integer | false    | Starting block number for filtering logs  |
| toBlock   | query | integer | false    | Ending block number for filtering logs    |
| blockHash | query | string  | false    | Filter logs by block hash                 |

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
  "totalData": {}
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
  "success": true,
  "block": {}
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

_Get v2 log information_

<h3 id="get__api_v2_logs-description">Description</h3>
<p>Retrieve logs using filters for block range, address, and topics. If omitted, default values are applied: "fromBlock" defaults to "earliest" and "toBlock" defaults to "latest". The "address" parameter accepts either a single address or a JSON array of addresses, while "topics" accepts a JSON array of topics.</p>

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

> Example responses

> 200 Response

```json
{
  "success": true,
  "cycles": []
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
  "port": 8080
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

## get__is_alive

`GET /is-alive`

_Check if the collector server is alive._

> Example responses

> 200 Response

```json
{
  "success": true,
  "alive": true
}
```

<h3 id="get__api_is-alive-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [IsAliveResponse](#schemaisaliveresponse)   |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |


<aside class="success">
This operation does not require authentication.
</aside>

## get__is_healthy

`GET /is-healthy`

_Assess if the collector server is healthy._

> Example responses

> 200 Response

```json
{
  "success": true,
  "healthy": true
}
```

<h3 id="get__api_is-healthy-responses">Responses</h3>

| Status | Meaning                                                          | Description         | Schema                                |
| ------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)          | Successful response | [IsHealthyResponse](#schemaishealthyresponse)   |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1) | Invalid request     | [ErrorResponse](#schemaerrorresponse) |

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
  "success": true,
  "metrics": {}
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
  "receipts": [],
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

```json
{
  "success": true,
  "alive": true
}
```

### Properties

| Name    | Type    | Required | Restrictions | Description                                |
| ------- | ------- | -------- | ------------ | ------------------------------------------ |
| success | boolean | false    | none         | Indicates if the operation was successful. |
| alive   | boolean | false    | none         | Indicates if the server is alive.          |

<h2 id="tocS_IsHealthyResponse">IsHealthyResponse</h2>
<!-- backwards compatibility -->
<a id="schemaishealthyresponse"></a>
<a id="schema_IsHealthyResponse"></a>
<a id="tocSishealthyresponse"></a>
<a id="tocsishealthyresponse"></a>

Example:

```json
{
  "success": true,
  "healthy": true
}
```

### Properties

| Name    | Type    | Required | Restrictions | Description                                  |
| ------- | ------- | -------- | ------------ | -------------------------------------------- |
| success | boolean | false    | none         | Indicates if the operation was successful.   |
| healthy | boolean | false    | none         | Indicates if the server is healthy.          |

### Properties

| Name    | Type    | Required | Restrictions | Description                                |
| ------- | ------- | -------- | ------------ | ------------------------------------------ |
| success | boolean | false    | none         | Indicates if the operation was successful. |
| block   | object  | false    | none         | Object containing block details.           |

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