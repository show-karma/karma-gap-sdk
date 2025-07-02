/**
 * Unified types for SDK - using viem types directly
 * These types provide strong typing throughout the SDK
 */
import type { Hex, Hash, TransactionReceipt as ViemTransactionReceipt } from "viem";
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
    wait?: () => Promise<TransactionReceipt>;
}
/**
 * TransactionReceipt type - using viem's structure
 * Represents a transaction receipt after confirmation
 */
export interface TransactionReceipt extends ViemTransactionReceipt {
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
export declare function createTransaction(hash: Hash | string): Transaction;
/**
 * Helper to normalize transaction receipt
 * Converts viem receipt to our interface
 */
export declare function normalizeReceipt(receipt: ViemTransactionReceipt): TransactionReceipt;
/**
 * Type guard to check if a value is a valid Hex string
 */
export declare function isHex(value: unknown): value is Hex;
/**
 * Type guard to check if a value is a valid Hash
 */
export declare function isHash(value: unknown): value is Hash;
