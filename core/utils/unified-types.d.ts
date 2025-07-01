/**
 * Unified types for SDK - compatible with both ethers and viem
 * These types replace direct ethers dependencies
 */
import type { Hex } from "../types";
/**
 * BytesLike type - compatible with both ethers and viem
 * Represents data that can be interpreted as bytes
 */
export type BytesLike = string | Uint8Array | Hex;
/**
 * Transaction type - compatible with both ethers and viem
 * Represents a blockchain transaction
 */
export interface Transaction {
    hash?: string;
    to?: string;
    from?: string;
    nonce?: number;
    gasLimit?: bigint | string | number;
    gasPrice?: bigint | string | number;
    maxFeePerGas?: bigint | string | number;
    maxPriorityFeePerGas?: bigint | string | number;
    data?: string;
    value?: bigint | string | number;
    chainId?: number;
    wait?: () => Promise<TransactionReceipt>;
}
/**
 * TransactionReceipt type - compatible with both ethers and viem
 * Represents a transaction receipt after confirmation
 */
export interface TransactionReceipt {
    hash?: string;
    transactionHash?: string;
    transactionIndex?: number;
    blockHash?: string;
    blockNumber?: number;
    from?: string;
    to?: string;
    contractAddress?: string | null;
    status?: number;
    gasUsed?: bigint | string | number;
    effectiveGasPrice?: bigint | string | number;
    logs?: Array<any>;
    logsBloom?: string;
    cumulativeGasUsed?: bigint | string | number;
}
/**
 * AttestationResult type - used throughout the SDK
 */
export interface AttestationResult {
    uids: Hex[];
    tx: Transaction[];
}
/**
 * Helper to create a Transaction object from a hash
 */
export declare function createTransaction(hash: string): Transaction;
/**
 * Helper to normalize transaction receipt
 */
export declare function normalizeReceipt(receipt: any): TransactionReceipt;
