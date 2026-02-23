/**
 * Revoke attestation script
 *
 * Directly revokes attestations using the GAP multicall contract,
 * bypassing SDK schema resolution. Useful for revoking attestations
 * created with old schemas.
 *
 * Usage: npx ts-node core/scripts/revoke-attestation.ts
 */

import { ethers } from "ethers";
import MulticallABI from "../abi/MultiAttester.json";
import "dotenv/config";

// ─── CONFIGURE HERE ──────────────────────────────────────────────────────────

const PRIVATE_KEY = "";
const RPC_URL = "";
const MULTICALL_ADDRESS = ""; // from consts.ts -> Networks[network].contracts.multicall
const SCHEMA_UID = "";
const ATTESTATION_UIDS = [
  "",
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!PRIVATE_KEY || !RPC_URL || !MULTICALL_ADDRESS || !SCHEMA_UID || !ATTESTATION_UIDS[0]) {
    console.error("Fill in the configuration at the top of the file.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(MULTICALL_ADDRESS, MulticallABI, wallet);

  console.log(`Wallet:   ${wallet.address}`);
  console.log(`Schema:   ${SCHEMA_UID}`);
  console.log(`Revoking: ${ATTESTATION_UIDS.length} attestation(s)`);

  const payload = [
    {
      schema: SCHEMA_UID,
      data: ATTESTATION_UIDS.map((uid) => ({ uid, value: 0n })),
    },
  ];

  console.log("Sending transaction...");
  const tx = await contract.multiRevoke(payload);
  console.log(`Tx hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`Confirmed in block ${receipt.blockNumber}`);
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
