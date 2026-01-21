# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-01-20

### Breaking Changes

#### RPC URLs No Longer Hardcoded

The SDK no longer includes hardcoded RPC URLs. **You must now provide RPC URLs for the networks you use.**

This change was made to:
- Remove exposed API keys from published packages
- Allow consumers to use their own RPC providers
- Prevent rate limiting from shared API keys

### Migration Guide

**Before (0.4.x):**
```typescript
import { GAP } from "@show-karma/karma-gap-sdk";

const gap = new GAP({
  network: "optimism",
  // RPC URLs were hidden/hardcoded internally
});
```

**After (0.5.0):**
```typescript
import { GAP, type GAPRpcConfig } from "@show-karma/karma-gap-sdk";

// Helper to ensure RPC URL is defined
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const rpcUrls: GAPRpcConfig = {
  10: requireEnv("OPTIMISM_RPC_URL"),     // optimism
  42161: requireEnv("ARBITRUM_RPC_URL"),  // arbitrum
  // Only configure networks you need
};

const gap = new GAP({
  network: "optimism",
  rpcUrls,
});
```

### Error Messages

If you access a network without a configured RPC URL, you will receive:
```
RPC URL not configured for chain {chainId}
```

### Supported Chain IDs

| Chain ID | Network |
|----------|---------|
| 10 | optimism |
| 11155420 | optimism-sepolia |
| 42161 | arbitrum |
| 11155111 | sepolia |
| 84532 | base-sepolia |
| 42220 | celo |
| 1328 | sei-testnet |
| 1329 | sei |
| 1135 | lisk |
| 534352 | scroll |
| 8453 | base |
| 137 | polygon |

### New Types

Two new types are exported from the SDK:

```typescript
// Supported chain IDs
export type SupportedChainId =
  | 10        // optimism
  | 11155420  // optimism-sepolia
  | 42161     // arbitrum
  | 11155111  // sepolia
  | 84532     // base-sepolia
  | 42220     // celo
  | 1328      // sei-testnet
  | 1329      // sei
  | 1135      // lisk
  | 534352    // scroll
  | 8453      // base
  | 137;      // polygon

// RPC configuration type
export type GAPRpcConfig = Partial<Record<SupportedChainId, string>>;
```

### Removed

- `rpcUrl` field from `EASNetworkConfig` interface
- Hardcoded RPC URLs from `Networks` constant

### Changed

- `GAP` constructor now accepts optional `rpcUrls` configuration
- Internal scripts now use environment variables for RPC URLs
- `getWeb3Provider` utility now uses a registry pattern (internal change)

### Added

- `GAPRpcConfig` type for RPC URL configuration
- `SupportedChainId` type for type-safe chain ID references
- `gap.getProvider(chainId)` instance method for getting providers with instance-scoped RPC config
- `gap.rpcConfig` readonly property to access the instance's RPC configuration
- `clearProviderCache` utility function (for testing only)
- `.env.example` file with RPC URL placeholders

## [0.4.x] and earlier

See git history for previous changes.
