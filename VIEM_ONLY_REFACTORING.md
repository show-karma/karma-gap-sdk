# Viem-Only Refactoring Plan

## Goal

Remove all ethers dependencies from the SDK and make it viem-only, while maintaining adapters for backward compatibility.

## Approach

### Phase 1: Remove Ethers from Dependencies

- Remove ethers from package.json completely
- Keep only viem as the main Web3 library

### Phase 2: Update Core Types

- Replace all ethers types with viem types
- Ensure strong typing throughout
- Remove unified types in favor of viem types

### Phase 3: Update Utilities

- Keep ethers-to-viem adapters for backward compatibility
- Remove viem-to-ethers conversions
- Update all utilities to use viem natively

### Phase 4: Update Core Classes

- GAP class to use viem only
- Schema class to use viem types
- Contract interactions to use viem exclusively

### Phase 5: Update Entity Classes

- All entities to use viem types
- Remove Transaction type abstractions
- Use viem's type system directly

### Phase 6: Clean Up

- Remove unnecessary compatibility layers
- Ensure all imports are from viem
- Update examples to show viem usage only

## Benefits

1. Cleaner codebase with single dependency
2. Better performance with viem's optimized architecture
3. Stronger type safety with viem's type system
4. Smaller bundle size
5. Modern Web3 stack
