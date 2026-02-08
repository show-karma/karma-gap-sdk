# AI Assistant Instructions - karma-gap-sdk

**Purpose**: Route AI assistants to the correct SDK modules. Nothing else.

---

## Start Here

1. Read `README.md` (comprehensive 870-line guide) for API usage and examples
2. Understand the module hierarchy below
3. Load only the specific module files you need

---

## Module Hierarchy

```
GAP (facade)
├── Fetcher (abstract data retrieval - EAS GraphQL or custom API)
├── GapSchema (schema management)
├── GapContract (batch attestation contract)
└── Entities
    ├── Community / CommunityDetails
    ├── Project / ProjectDetails / ProjectUpdate / ProjectImpact / ProjectEndorsement
    ├── Grant / GrantDetails / GrantUpdate
    ├── Milestone / MilestoneCompleted
    └── MemberOf
```

---

## Routing Table

| Task | What to Read |
|------|-------------|
| Fetch entities | `core/class/GAP.ts` (facade methods), `core/class/Fetcher.ts` |
| Create/update entities | `core/class/entities/` - specific entity class |
| Schema changes | `core/class/GapSchema.ts`, `core/class/Schema.ts` |
| Contract interaction | `core/class/contract/`, `core/abi/` |
| Custom API integration | `core/class/karma-indexer/` |
| Gasless transactions | `core/utils/gelato.ts` |
| IPFS storage | `core/class/remote-storage/` |
| Network configs | `core/consts.ts`, `core/types.ts` |
| GraphQL queries | `core/class/GraphQL/` |

---

## Key Patterns

- **Two-attestation model**: Base entity + details attestation (e.g., Project + ProjectDetails)
- **UID references**: Attestations link via `refUID` for parent-child relationships
- **Fetcher abstraction**: Swap between EAS GraphQL (default) and custom API (karma-indexer)
- **Batch attestations**: GapContract wraps multiple attestations in one transaction
- **Gelato Relay**: Gasless transaction support via `@gelatonetwork/relay-sdk`
- **Networks**: Optimism, Celo, Optimism Sepolia (see `core/consts.ts`)

---

## Commands

```bash
yarn build              # Build the SDK
yarn lint               # ESLint
yarn format             # Prettier
```

---

## Critical Notes

- No test framework currently configured - manual examples in `core/scripts/`
- Uses ethers v6 (not v5) - different API from older versions
- All entities extend base `Attestation` class
- EAS SDK dependency: `@ethereum-attestation-service/eas-sdk`
- Barrel export in `index.ts` re-exports everything from `core/`

---

## Git Rules

- **NEVER** mention Claude, AI, or any AI assistant in commit messages or PR descriptions
- Use conventional commits format
