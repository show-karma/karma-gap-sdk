/**
 * Migration helpers for converting ethers types to viem
 * Provides utilities for backward compatibility
 */
import type { Hex, Address, TransactionRequest as ViemTransactionRequest, TransactionReceipt as ViemTransactionReceipt } from "viem";
/**
 * Convert ethers BigNumber to bigint
 * @param value - Ethers BigNumber or compatible value
 * @returns bigint value
 */
export declare function ethersBigNumberToBigInt(value: any): bigint;
/**
 * Convert ethers address to viem Address
 * @param address - Ethers address format
 * @returns Viem Address type
 */
export declare function ethersAddressToViem(address: string | undefined | null): Address | undefined;
/**
 * Convert ethers transaction to viem TransactionRequest
 * @param tx - Ethers transaction object
 * @returns Viem TransactionRequest
 */
export declare function ethersTransactionToViem(tx: any): ViemTransactionRequest;
/**
 * Convert ethers transaction receipt to viem format
 * @param receipt - Ethers transaction receipt
 * @returns Viem-compatible receipt
 */
export declare function ethersReceiptToViem(receipt: any): ViemTransactionReceipt;
/**
 * Convert ethers hex string to viem Hex type
 * @param hex - Ethers hex string
 * @returns Viem Hex type
 */
export declare function ethersHexToViem(hex: string | undefined | null): Hex | undefined;
/**
 * Convert ethers units to viem
 * @param value - Value in ethers format
 * @param unit - Unit name (ether, gwei, etc.)
 * @returns bigint value in wei
 */
export declare function ethersUnitsToViem(value: string | number, unit?: string): bigint;
/**
 * Format bigint to human-readable format
 * @param value - bigint value in wei
 * @param unit - Unit to format to
 * @returns Formatted string
 */
export declare function formatBigInt(value: bigint, unit?: string): string;
/**
 * Type guard to check if value is an ethers BigNumber
 */
export declare function isEthersBigNumber(value: any): boolean;
/**
 * Type guard to check if value is an ethers transaction
 */
export declare function isEthersTransaction(tx: any): boolean;
/**
 * Unified parseUnits function
 */
export declare function parseUnits(value: string, decimals: number): bigint;
/**
 * Unified formatUnits function
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
