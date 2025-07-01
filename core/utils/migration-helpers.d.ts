import { type Hex, type TransactionReceipt as ViemTransactionReceipt } from "viem";
import { Transaction as EthersTransaction } from "ethers";
/**
 * Convert ethers transaction to viem format
 */
export declare function ethersToViemTransaction(tx: EthersTransaction): any;
/**
 * Convert viem transaction receipt to ethers format
 */
export declare function viemToEthersReceipt(receipt: ViemTransactionReceipt): any;
/**
 * Unified parseUnits function that works with both ethers and viem
 */
export declare function parseUnits(value: string, decimals: number): bigint;
/**
 * Unified formatUnits function that works with both ethers and viem
 */
export declare function formatUnits(value: bigint | string, decimals: number): string;
/**
 * Unified isAddress function
 */
export declare function isAddress(address: string): boolean;
/**
 * Unified getAddress function (checksum address)
 */
export declare function getAddress(address: string): Hex;
/**
 * Get chain ID from any provider type
 */
export declare function getChainId(provider: any): Promise<number>;
/**
 * Get block number from any provider type
 */
export declare function getBlockNumber(provider: any): Promise<number>;
/**
 * Send transaction using any signer type
 */
export declare function sendTransaction(signer: any, tx: any): Promise<Hex>;
/**
 * Wait for transaction confirmation
 */
export declare function waitForTransaction(provider: any, hash: Hex, confirmations?: number): Promise<ViemTransactionReceipt>;
