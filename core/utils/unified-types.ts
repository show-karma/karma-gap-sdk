/**
 * Unified types for SDK - using viem types directly
 * These types provide strong typing throughout the SDK
 */

import type {
  Hex,
  Hash,
  TransactionReceipt as ViemTransactionReceipt,
  Transaction as ViemTransaction,
  TransactionRequest,
} from "viem";

/**
 * BytesLike type - compatible with viem
 * Represents data that can be interpreted as bytes
 */
export type BytesLike = Hex | Uint8Array;

/**
 * Transaction type - using viem's transaction type
 * Represents a blockchain transaction with strong typing
 */
export interface Transaction {
  hash?: Hash;
  to?: Hex | null;
  from?: Hex;
  nonce?: number;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  data?: Hex;
  value?: bigint;
  chainId?: number;
  type?: "legacy" | "eip2930" | "eip1559";
  accessList?: Array<{
    address: Hex;
    storageKeys: Hex[];
  }>;
  // Method for compatibility
  wait?: () => Promise<TransactionReceipt>;
}

/**
 * TransactionReceipt type - using viem's structure
 * Represents a transaction receipt after confirmation
 */
export interface TransactionReceipt extends ViemTransactionReceipt {
  // Additional fields for compatibility if needed
  hash?: Hash;
}

/**
 * AttestationResult type - used throughout the SDK
 * Strongly typed with viem types
 */
export interface AttestationResult {
  uids: Hex[];
  tx: Transaction[];
}

/**
 * Helper to create a Transaction object from a hash
 * Ensures strong typing
 */
export function createTransaction(hash: Hash | string): Transaction {
  return {
    hash: hash as Hash,
    type: "legacy", // Default type for compatibility
  };
}

/**
 * Helper to normalize transaction receipt
 * Converts viem receipt to our interface
 */
export function normalizeReceipt(
  receipt: ViemTransactionReceipt
): TransactionReceipt {
  return {
    ...receipt,
    hash: receipt.transactionHash,
  };
}

/**
 * Type guard to check if a value is a valid Hex string
 */
export function isHex(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Type guard to check if a value is a valid Hash
 */
export function isHash(value: unknown): value is Hash {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}
