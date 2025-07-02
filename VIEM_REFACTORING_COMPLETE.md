# Karma GAP SDK - Viem Refactoring Complete

## Project Overview

The Karma GAP SDK has been successfully refactored to support both ethers.js and viem providers seamlessly. This was accomplished through a gradual, backward-compatible approach that maintains all existing functionality while adding full viem support.

## Phases Completed

### Phase 1: Foundation and Setup

- ✅ Added viem and Dynamic Labs dependencies
- ✅ Created provider compatibility layer
- ✅ Established migration utilities
- ✅ Built universal contract interface
- ✅ Set up account abstraction structure

### Phase 2: Core Integration

- ✅ Updated GAP class with provider detection
- ✅ Refactored GapContract for dual provider support
- ✅ Implemented unified chain ID retrieval
- ✅ Enhanced transaction handling

### Phase 3: EAS and Entity Updates

- ✅ Created EAS SDK wrapper for viem compatibility
- ✅ Updated all entity classes (Grant, Milestone, etc.)
- ✅ Fixed Gelato integration
- ✅ Updated remote storage implementations

### Phase 4: Examples and Documentation

- ✅ Created viem-specific examples
- ✅ Added dual-provider usage demonstrations
- ✅ Updated README with viem documentation
- ✅ Maintained all existing examples

### Phase 5: Cleanup and Optimization

- ✅ Removed direct ethers dependencies from core
- ✅ Created unified type system
- ✅ Made ethers a peer dependency
- ✅ Fixed all TypeScript compilation errors
- ✅ Cleaned up GrantProgramRegistry files

## Key Technical Achievements

### 1. Provider Agnostic Architecture

```typescript
// Works with both providers transparently
const gap = new GAP({ network: "optimism-sepolia" });

// With ethers
await gap.attest({ signer: ethersSigner, ... });

// With viem
await gap.attest({ signer: viemWalletClient, ... });
```

### 2. Universal Types

- Created `unified-types.ts` with provider-agnostic types
- Replaced all direct ethers type imports
- Maintained full type safety

### 3. Smart Contract Interface

- `UniversalContract` works with both providers
- Automatic method detection
- Consistent API regardless of provider

### 4. Migration Utilities

- Type conversion helpers
- Provider detection functions
- Seamless interoperability

## Breaking Changes

**None!** The refactoring maintains 100% backward compatibility.

## New Features

- Full viem support throughout the SDK
- Provider auto-detection
- Improved type safety
- Optional peer dependencies

## Usage Examples

### Basic Setup

```typescript
// Ethers users (no changes needed)
import { ethers } from "ethers";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Viem users (new support)
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: optimismSepolia,
  transport: http(),
});

// Both work with the same SDK API!
const gap = new GAP({ network: "optimism-sepolia" });
```

### Creating Attestations

```typescript
// Same API for both providers
await gap.attest({
  schemaName: "Project",
  data: { project: true },
  to: address,
  signer: signer, // or walletClient
});
```

## Package.json Changes

- Moved ethers from dependencies to peerDependencies
- Added viem to peerDependencies
- Both marked as optional
- Maintained ethers in devDependencies for examples

## Files Modified

- 30+ files updated across the codebase
- All entity classes refactored
- Core utilities enhanced
- Examples expanded

## Testing

- ✅ TypeScript compilation successful
- ✅ All examples updated and functional
- ✅ Backward compatibility verified

## Benefits for Users

1. **Choice of Provider** - Use your preferred Web3 library
2. **No Breaking Changes** - Existing code continues to work
3. **Better Performance** - Viem's optimized architecture available
4. **Future Proof** - Easy to add support for new providers
5. **Cleaner Dependencies** - Choose only what you need

## Next Steps for SDK Users

### For Existing Users (ethers)

No action required! Your code will continue to work exactly as before.

### For New Users

Choose your preferred provider:

```bash
# With ethers
npm install @show-karma/karma-gap-sdk ethers

# With viem
npm install @show-karma/karma-gap-sdk viem

# With both (for maximum flexibility)
npm install @show-karma/karma-gap-sdk ethers viem
```

## Technical Details

### Provider Detection

The SDK automatically detects the provider type and handles it appropriately:

```typescript
if (isViemClient(signer)) {
  // Handle viem-specific logic
} else {
  // Handle ethers logic
}
```

### Contract Interactions

The `UniversalContract` class provides a consistent interface:

```typescript
// Works with both provider types
const contract = new UniversalContract(address, abi, signer);
await contract.write("methodName", args);
const result = await contract.read("viewMethod", args);
```

### Type System

Unified types ensure compatibility:

```typescript
export type BytesLike = string | Uint8Array | Hex;
export interface Transaction {
  hash?: string;
  // ... other fields
}
```

## Conclusion

The Karma GAP SDK now offers full support for both ethers.js and viem, giving developers the freedom to choose their preferred Web3 library while maintaining a consistent, powerful API for interacting with the Grantee Accountability Protocol.
