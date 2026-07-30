# Codex Instructions For karma-gap-sdk

This is the Karma TypeScript SDK. Read this file, `CLAUDE.md`, and `readme.md`
before editing SDK code.

## Required Patterns

- Preserve the two-attestation model: base entity plus details attestation.
- Use UID/refUID relationships consistently.
- Keep the Fetcher abstraction intact; do not hardwire data retrieval to one
  backend unless the task explicitly requires it.
- Use ethers v6 APIs.
- Follow existing entity, contract, schema, Gelato, IPFS, and GraphQL module
  patterns based on the routing table in `CLAUDE.md`.
- No `any` or `as any` in new SDK code unless there is no practical typed
  alternative and the final response calls out the reason.

## Checks

- Run `yarn build` for behavior/type changes when practical.
- Run `yarn lint` and `yarn format` when relevant.
- Run `yarn test` (Jest, specs live in `core/__tests__/`) for behavior changes.

## Commands

```bash
yarn build
yarn test
yarn test:coverage
yarn lint
yarn format
```

