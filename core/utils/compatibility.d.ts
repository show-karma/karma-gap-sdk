/**
 * Compatibility utilities for viem-based SDK
 * Provides helpers for working with viem types
 */
import type { Hex, Hash, Address, PublicClient, WalletClient, Transport, Chain, Account } from "viem";
import { type UniversalContract } from "./viem-contracts";
import { parseUnits, formatUnits, isAddress, getAddress } from "./migration-helpers";
export { parseUnits, formatUnits, isAddress, getAddress };
/**
 * Create a contract instance that works with any provider
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param signerOrProvider - Ethers or viem provider/signer
 * @returns Universal contract instance
 */
export declare function createContract(address: string, abi: any, signerOrProvider: any): Promise<UniversalContract>;
/**
 * Check if a value is a valid address
 * @param value - Value to check
 * @returns True if valid address
 */
export declare function isValidAddress(value: unknown): value is Address;
/**
 * Check if a value is a valid hex string
 * @param value - Value to check
 * @returns True if valid hex
 */
export declare function isValidHex(value: unknown): value is Hex;
/**
 * Check if a value is a valid hash
 * @param value - Value to check
 * @returns True if valid hash
 */
export declare function isValidHash(value: unknown): value is Hash;
/**
 * Normalize address to checksummed format
 * @param address - Address to normalize
 * @returns Checksummed address
 */
export declare function normalizeAddress(address: string): Address;
/**
 * Normalize hex string
 * @param hex - Hex string to normalize
 * @returns Normalized hex
 */
export declare function normalizeHex(hex: string): Hex;
/**
 * Get viem client from any provider type
 * @param provider - Provider (ethers or viem)
 * @returns Viem client
 */
export declare function getViemClient(provider: any): Promise<PublicClient<Transport, Chain> | WalletClient<Transport, Chain, Account>>;
/**
 * Check if provider is a wallet client
 * @param provider - Provider to check
 * @returns True if wallet client
 */
export declare function isWalletClient(provider: any): provider is WalletClient<Transport, Chain, Account>;
/**
 * Check if provider is a KernelClient from ZeroDev
 * @param provider - Provider to check
 * @returns True if KernelClient
 */
export declare function isKernelClient(provider: any): boolean;
/**
 * Check if provider supports smart account features (KernelClient)
 * @param provider - Provider to check
 * @returns True if smart account client
 */
export declare function isSmartAccountClient(provider: any): boolean;
/**
 * Check if provider supports paymaster (gas sponsorship)
 * @param provider - Provider to check
 * @returns True if supports paymaster
 */
export declare function supportsPaymaster(provider: any): boolean;
/**
 * Check if provider is a public client
 * @param provider - Provider to check
 * @returns True if public client
 */
export declare function isPublicClient(provider: any): provider is PublicClient<Transport, Chain>;
/**
 * Convert bigint to hex string
 * @param value - BigInt value
 * @returns Hex string
 */
export declare function bigIntToHex(value: bigint): Hex;
/**
 * Convert hex string to bigint
 * @param hex - Hex string
 * @returns BigInt value
 */
export declare function hexToBigInt(hex: Hex): bigint;
/**
 * Safe parse integer from various formats
 * @param value - Value to parse
 * @returns Parsed integer or undefined
 */
export declare function safeParseInt(value: unknown): number | undefined;
