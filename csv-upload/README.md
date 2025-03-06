# Configuration

This directory contains configuration files for the application.

## Files

### `config.ts`

Contains non-sensitive configuration and constants:

- `CHAIN_IDS`: Chain IDs for different networks
- `DEFAULT_CONFIG`: Default configuration values
- `API_ENDPOINTS`: API endpoint paths
- `LINK_TYPES`: Types of links supported
- `GRANT_UPDATE_TYPES`: Types of grant updates

### `keys.json`

Contains sensitive configuration (not committed to version control). Copy `keys.example.json` to `keys.json` and fill in your values.

Required structure:
```json
{
  "optimism": {
    "privateKey": "your_private_key_here",
    "rpcURL": "your_rpc_url_here",
    "gapAPI": "your_gap_api_url_here",
    "ipfsKey": "your_ipfs_key_here"
  },
  // ... other networks with same structure
  "gapAccessToken": "your_gap_access_token_here"
}
```

## Networks Supported

- optimism
- optimism-sepolia
- sepolia
- arbitrum
- base-sepolia
- celo
- sei
- sei-testnet

## Setup

1. Copy `keys.example.json` to `keys.json`
2. Fill in your values in `keys.json`
3. Never commit `keys.json` to version control

## Environment Variables

The following environment variables can override configuration values if present:

- `GAP_NETWORK`: Override the default network
- `GAP_API_URL`: Override the GAP API URL
- `MAINNET_RPC_URL`: Override the mainnet RPC URL

## Usage

Import configuration values from `config.ts`:

```typescript
import { 
  CHAIN_IDS, 
  DEFAULT_CONFIG, 
  API_ENDPOINTS,
  LINK_TYPES,
  GRANT_UPDATE_TYPES 
} from "./config/config";
``` 