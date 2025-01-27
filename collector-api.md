---
title: Collector API v1.0.0
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="collector-api">Collector API</h1>


## get__api_account

`GET /api/account`

*Get account information*

<h3 id="get__api_account-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|count|query|string|false|none|
|page|query|string|false|none|
|address|query|string|false|none|
|type|query|string|false|none|
|accountType|query|string|false|none|
|startCycle|query|string|false|none|
|endCycle|query|string|false|none|
|accountId|query|string|false|none|
|blockNumber|query|string|false|none|
|blockHash|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "accounts": [
    {}
  ],
  "totalPages": 0,
  "totalAccounts": 0,
  "totalContracts": 0
}
```

<h3 id="get__api_account-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[AccountResponse](#schemaaccountresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_token

`GET /api/token`

*Get token information*

<h3 id="get__api_token-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|string|false|none|
|address|query|string|false|none|
|contractAddress|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "tokens": [
    {}
  ],
  "totalPages": 0,
  "totalTokenHolders": 0
}
```

<h3 id="get__api_token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[TokenResponse](#schematokenresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_transaction

`GET /api/transaction`

*Get transaction information*

<h3 id="get__api_transaction-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|count|query|string|false|none|
|page|query|string|false|none|
|txHash|query|string|false|none|
|address|query|string|false|none|
|token|query|string|false|none|
|filterAddress|query|string|false|none|
|txType|query|string|false|none|
|startCycle|query|string|false|none|
|endCycle|query|string|false|none|
|txId|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "transactions": [
    {}
  ],
  "totalPages": 0,
  "totalTransactions": 0
}
```

<h3 id="get__api_transaction-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[TransactionResponse](#schematransactionresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__usage_metrics

`GET /usage/metrics`

*Get usage metrics*

> Example responses

> 200 Response

```json
{
  "success": true,
  "metrics": {}
}
```

<h3 id="get__usage_metrics-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[MetricsResponse](#schemametricsresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_receipt

`GET /api/receipt`

*Get receipt information*

<h3 id="get__api_receipt-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|txHash|query|string|false|none|
|blockNumber|query|string|false|none|
|blockHash|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "receipt": {}
}
```

<h3 id="get__api_receipt-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[ReceiptResponse](#schemareceiptresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_originalTx

`GET /api/originalTx`

*Get original transaction information*

<h3 id="get__api_originaltx-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|txHash|query|string|false|none|
|decode|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "originalTx": {}
}
```

<h3 id="get__api_originaltx-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[OriginalTxResponse](#schemaoriginaltxresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_log

`GET /api/log`

*Get log information*

<h3 id="get__api_log-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|fromBlock|query|string|false|none|
|toBlock|query|string|false|none|
|address|query|string|false|none|
|topics|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "logs": [
    {}
  ]
}
```

<h3 id="get__api_log-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[LogResponse](#schemalogresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__totalData

`GET /totalData`

*Get total data information*

<h3 id="get__totaldata-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|totalStakeData|query|string|false|none|
|beforeTimestamp|query|string|false|none|
|afterTimestamp|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "totalData": {}
}
```

<h3 id="get__totaldata-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[TotalDataResponse](#schematotaldataresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_blocks

`GET /api/blocks`

*Get block information*

<h3 id="get__api_blocks-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|blockNumber|query|string|false|none|
|blockHash|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "block": {}
}
```

<h3 id="get__api_blocks-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[BlockResponse](#schemablockresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## get__api_v2_logs

`GET /api/v2/logs`

*Get v2 log information*

<h3 id="get__api_v2_logs-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|fromBlock|query|string|false|none|
|toBlock|query|string|false|none|
|address|query|string|false|none|
|topics|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "success": true,
  "logs": [
    {}
  ]
}
```

<h3 id="get__api_v2_logs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful response|[LogResponse](#schemalogresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_AccountResponse">AccountResponse</h2>
<!-- backwards compatibility -->
<a id="schemaaccountresponse"></a>
<a id="schema_AccountResponse"></a>
<a id="tocSaccountresponse"></a>
<a id="tocsaccountresponse"></a>

```json
{
  "success": true,
  "accounts": [
    {}
  ],
  "totalPages": 0,
  "totalAccounts": 0,
  "totalContracts": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|accounts|[object]|false|none|none|
|totalPages|integer|false|none|none|
|totalAccounts|integer|false|none|none|
|totalContracts|integer|false|none|none|

<h2 id="tocS_TokenResponse">TokenResponse</h2>
<!-- backwards compatibility -->
<a id="schematokenresponse"></a>
<a id="schema_TokenResponse"></a>
<a id="tocStokenresponse"></a>
<a id="tocstokenresponse"></a>

```json
{
  "success": true,
  "tokens": [
    {}
  ],
  "totalPages": 0,
  "totalTokenHolders": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|tokens|[object]|false|none|none|
|totalPages|integer|false|none|none|
|totalTokenHolders|integer|false|none|none|

<h2 id="tocS_TransactionResponse">TransactionResponse</h2>
<!-- backwards compatibility -->
<a id="schematransactionresponse"></a>
<a id="schema_TransactionResponse"></a>
<a id="tocStransactionresponse"></a>
<a id="tocstransactionresponse"></a>

```json
{
  "success": true,
  "transactions": [
    {}
  ],
  "totalPages": 0,
  "totalTransactions": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|transactions|[object]|false|none|none|
|totalPages|integer|false|none|none|
|totalTransactions|integer|false|none|none|

<h2 id="tocS_MetricsResponse">MetricsResponse</h2>
<!-- backwards compatibility -->
<a id="schemametricsresponse"></a>
<a id="schema_MetricsResponse"></a>
<a id="tocSmetricsresponse"></a>
<a id="tocsmetricsresponse"></a>

```json
{
  "success": true,
  "metrics": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|metrics|object|false|none|none|

<h2 id="tocS_ReceiptResponse">ReceiptResponse</h2>
<!-- backwards compatibility -->
<a id="schemareceiptresponse"></a>
<a id="schema_ReceiptResponse"></a>
<a id="tocSreceiptresponse"></a>
<a id="tocsreceiptresponse"></a>

```json
{
  "success": true,
  "receipt": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|receipt|object|false|none|none|

<h2 id="tocS_OriginalTxResponse">OriginalTxResponse</h2>
<!-- backwards compatibility -->
<a id="schemaoriginaltxresponse"></a>
<a id="schema_OriginalTxResponse"></a>
<a id="tocSoriginaltxresponse"></a>
<a id="tocsoriginaltxresponse"></a>

```json
{
  "success": true,
  "originalTx": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|originalTx|object|false|none|none|

<h2 id="tocS_LogResponse">LogResponse</h2>
<!-- backwards compatibility -->
<a id="schemalogresponse"></a>
<a id="schema_LogResponse"></a>
<a id="tocSlogresponse"></a>
<a id="tocslogresponse"></a>

```json
{
  "success": true,
  "logs": [
    {}
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|logs|[object]|false|none|none|

<h2 id="tocS_TotalDataResponse">TotalDataResponse</h2>
<!-- backwards compatibility -->
<a id="schematotaldataresponse"></a>
<a id="schema_TotalDataResponse"></a>
<a id="tocStotaldataresponse"></a>
<a id="tocstotaldataresponse"></a>

```json
{
  "success": true,
  "totalData": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|totalData|object|false|none|none|

<h2 id="tocS_BlockResponse">BlockResponse</h2>
<!-- backwards compatibility -->
<a id="schemablockresponse"></a>
<a id="schema_BlockResponse"></a>
<a id="tocSblockresponse"></a>
<a id="tocsblockresponse"></a>

```json
{
  "success": true,
  "block": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|block|object|false|none|none|

<h2 id="tocS_ErrorResponse">ErrorResponse</h2>
<!-- backwards compatibility -->
<a id="schemaerrorresponse"></a>
<a id="schema_ErrorResponse"></a>
<a id="tocSerrorresponse"></a>
<a id="tocserrorresponse"></a>

```json
{
  "success": true,
  "error": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|success|boolean|false|none|none|
|error|string|false|none|none|

