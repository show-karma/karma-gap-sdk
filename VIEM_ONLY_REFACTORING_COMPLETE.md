# Viem-Only Refactoring Complete

## Summary

The Karma GAP SDK has been successfully refactored to use viem as its primary Web3 library, removing the direct dependency on ethers while maintaining backward compatibility through adapters.

## What Changed

### 1. Dependencies

- **Removed**: ethers from direct dependencies
- **Kept**: viem as the primary Web3 library
- **Maintained**: Backward compatibility through adapter pattern

### 2. Core Types

- All types now use viem's type system directly
- Strong typing throughout with viem types:
  - `Hex`, `Hash`, `Address` from viem
  - `PublicClient`, `WalletClient` for providers
  - `TransactionReceipt`, `TransactionRequest` from viem

### 3. Utilities

#### Provider Adapter (`core/utils/provider-adapter.ts`)

- Converts ethers providers/signers to viem clients
- One-way conversion only (ethers → viem)
- Supports both providers and signers

#### Migration Helpers (`core/utils/migration-helpers.ts`)

- Converts ethers types to viem types
- Handles BigNumber → bigint conversions
- Address and hex string normalization

#### Viem Contracts (`core/utils/viem-contracts.ts`)

- Universal contract interface using viem
- Works with both ethers and viem providers
- Strong typing for contract interactions

#### Unified Types (`core/utils/unified-types.ts`)

- Uses viem types directly
- Provides `BytesLike`, `Transaction`, `TransactionReceipt` types
- Helper functions for creating transactions

### 4. Core Classes

#### GAP Class

- Updated to use viem types
- Contract methods use `createUniversalContract`
- Supports both ethers and viem providers transparently

#### Schema Class

- Uses unified types from viem
- Transaction handling with viem types

#### GapContract Class

- Dual support for ethers and viem signers
- Signature handling for both provider types
- Transaction methods work with both

#### Entity Classes

- All entities use viem types
- Transaction creation uses unified helpers

### 5. Backward Compatibility

The SDK maintains full backward compatibility with ethers through:

1. **Automatic Provider Detection**: The SDK detects if you're using ethers or viem
2. **Transparent Conversion**: Ethers providers are automatically converted to viem clients
3. **Same API**: No changes to the public API - works the same with both libraries

### 6. Usage Examples

#### With Viem (Recommended)

```typescript
import { createWalletClient, http } from "viem";
import { optimism } from "viem/chains";
import { GAP } from "@karma-gap/sdk";

const walletClient = createWalletClient({
  chain: optimism,
  transport: http(),
});

const gap = GAP.getInstance({
  network: "optimism",
});

// Native viem support
await gap.attest({
  schemaName: "Project",
  data: { project: true },
  to: "0x...",
  signer: walletClient,
});
```

#### With Ethers (Backward Compatibility)

```typescript
import { ethers } from "ethers";
import { GAP } from "@karma-gap/sdk";

const provider = new ethers.JsonRpcProvider("...");
const signer = new ethers.Wallet(privateKey, provider);

const gap = GAP.getInstance({
  network: "optimism",
});

// Ethers signer is automatically converted
await gap.attest({
  schemaName: "Project",
  data: { project: true },
  to: "0x...",
  signer: signer,
});
```

## Benefits

1. **Modern Stack**: Uses viem's optimized architecture
2. **Better Performance**: Viem is more performant than ethers
3. **Smaller Bundle Size**: Viem has a smaller footprint
4. **Strong Typing**: Better TypeScript support with viem's type system
5. **Future-Proof**: Aligned with modern Web3 development
6. **Backward Compatible**: Existing ethers users can continue using the SDK

## Migration Guide for SDK Users

### If you're using ethers:

- **No changes required!** The SDK automatically handles ethers providers
- Your existing code will continue to work

### If you want to migrate to viem:

1. Install viem: `npm install viem`
2. Replace ethers providers with viem clients
3. Use the same SDK methods - the API is identical

## Technical Details

### Type System

- All internal types use viem's type system
- `Hex` type for addresses and hex strings
- `bigint` for all numeric values (no more BigNumber)
- Strong typing for transactions and receipts

### Provider Handling

- Automatic detection of provider type
- Seamless conversion from ethers to viem
- No performance overhead for viem users
- Minimal overhead for ethers users (one-time conversion)

### Contract Interactions

- Universal contract interface works with both providers
- Type-safe contract calls
- Automatic ABI handling

## Testing

The SDK has been tested with:

- ✅ TypeScript compilation (no errors)
- ✅ Viem client usage
- ✅ Ethers provider backward compatibility
- ✅ Contract interactions
- ✅ Transaction handling
- ✅ Signature generation

## Conclusion

The Karma GAP SDK is now a viem-first library with excellent backward compatibility for ethers users. This positions the SDK for the future while ensuring existing integrations continue to work seamlessly.
