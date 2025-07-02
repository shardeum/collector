# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shardeum Collector is a Node.js/TypeScript service that collects blockchain data from distributor nodes and serves it to RPC servers. It's part of the Shardeum blockchain ecosystem.

## Development Commands

### Build & Run
```bash
# Install dependencies
npm install

# Build TypeScript (compiles to dist/)
npm run prepare

# Run main services (use pm2 in production)
npm run collector      # Main data collection service
npm run server        # REST API server
npm run log_server    # WebSocket server for EVM logs

# Development with watch mode
npm run server:watch  # Auto-restart server on changes
```

### Testing
```bash
# Run all tests
npm test

# Run a specific test file
npm test tests/unit/collectors/rmq_transactions.test.ts
```

### Code Quality
```bash
# Lint code (TypeScript)
npm run lint

# Fix linting issues
npm run fix

# Format code (Prettier)
npm run format-fix

# Check formatting
npm run format-check

# Google TypeScript Style check
npm run check
```

### Clean & Reset
```bash
# Remove all generated files and databases
npm run clean

# Remove only database and log files (keep build)
npm run flush
```

## Architecture Overview

The collector operates in two modes:
- **WebSocket Mode**: Real-time streaming from distributors
- **Message Queue Mode**: RabbitMQ-based consumption

### Key Components

1. **Data Collection** (`src/collector.ts`)
   - Syncs historical data from distributors
   - Subscribes to real-time updates
   - Validates data cryptographically
   - Stores in SQLite and log files

2. **API Server** (`src/server.ts`)
   - REST endpoints for querying collected data
   - Serves accounts, transactions, receipts, blocks
   - Used by RPC servers and explorers

3. **Log Server** (`src/log_server.ts`)
   - WebSocket endpoint for EVM log subscriptions
   - Supports eth_subscribe for newHeads and logs

4. **Storage**
   - SQLite database (primary storage)
   - Log files in `data-logs/` directory
   - Tables: cycles, accounts, transactions, receipts, originalTxsData, blocks

5. **Data Processing**
   - Transaction decoding (EVM)
   - Block generation from cycles
   - Receipt processing with state changes

### Configuration

- `config.json`: Distributor connection info and collector keys
- `src/config/index.ts`: Application settings
- `.secrets.json`: Production keys (gitignored)

### Important Settings

```typescript
// src/config/index.ts
enableShardeumIndexer: false,  // Set to true only for validator services
useMQInstead: false,          // Switch between WebSocket/RabbitMQ modes
```

## Code Style

- **TypeScript**: Strict mode disabled, Google style guide via gts
- **Formatting**: Prettier with single quotes, no semicolons, 120 char width
- **Linting**: ESLint with security plugins
- **Imports**: Use relative paths for local modules

## Testing Approach

- Jest with TypeScript support
- Unit tests in `tests/unit/`
- Test files use `.test.ts` suffix
- Mock external dependencies (RabbitMQ, WebSocket)

## Common Tasks

### Adding a New API Endpoint
1. Add route handler in `src/server.ts`
2. Implement data query in appropriate storage module
3. Add validation middleware if needed
4. Update OpenAPI spec in `collector-openapi.yaml`

### Modifying Data Collection
1. Update collector logic in `src/collector.ts`
2. Modify data validation in `src/class/ValidateData.ts`
3. Update storage schema if needed
4. Test with local distributor first

### Database Schema Changes
1. Modify table creation in storage modules
2. Add migration logic for existing databases
3. Update corresponding TypeScript interfaces
4. Test data sync from scratch

## Important Notes

- Always validate incoming data signatures
- Use pm2 for production deployment
- Monitor logs for sync errors
- WebSocket connections auto-reconnect
- Database operations use transactions for consistency
- Rate limiting enabled on API endpoints
- Cache frequently accessed data (blocks, cycles)