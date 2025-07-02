/**
 * Compatibility utilities for viem-based SDK
 * Provides helpers for working with viem types
 */

import type {
  Hex,
  Hash,
  Address,
  PublicClient,
  WalletClient,
  Transport,
  Chain,
  Account,
} from "viem";
import { isAddress as viemIsAddress } from "viem";
import {
  isEthersProvider,
  isEthersSigner,
  adaptEthersToViem,
} from "./provider-adapter";
import {
  createUniversalContract,
  type UniversalContract,
} from "./viem-contracts";
import {
  parseUnits,
  formatUnits,
  isAddress,
  getAddress,
} from "./migration-helpers";

// Re-export commonly used functions with unified interfaces
export { parseUnits, formatUnits, isAddress, getAddress };

/**
 * Create a contract instance that works with any provider
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param signerOrProvider - Ethers or viem provider/signer
 * @returns Universal contract instance
 */
export async function createContract(
  address: string,
  abi: any,
  signerOrProvider: any
): Promise<UniversalContract> {
  return createUniversalContract(address, abi, signerOrProvider);
}

/**
 * Check if a value is a valid address
 * @param value - Value to check
 * @returns True if valid address
 */
export function isValidAddress(value: unknown): value is Address {
  return typeof value === "string" && viemIsAddress(value);
}

/**
 * Check if a value is a valid hex string
 * @param value - Value to check
 * @returns True if valid hex
 */
export function isValidHex(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Check if a value is a valid hash
 * @param value - Value to check
 * @returns True if valid hash
 */
export function isValidHash(value: unknown): value is Hash {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

/**
 * Normalize address to checksummed format
 * @param address - Address to normalize
 * @returns Checksummed address
 */
export function normalizeAddress(address: string): Address {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address as Address;
}

/**
 * Normalize hex string
 * @param hex - Hex string to normalize
 * @returns Normalized hex
 */
export function normalizeHex(hex: string): Hex {
  if (!hex.startsWith("0x")) {
    hex = "0x" + hex;
  }
  if (!isValidHex(hex)) {
    throw new Error(`Invalid hex: ${hex}`);
  }
  return hex as Hex;
}

/**
 * Get viem client from any provider type
 * @param provider - Provider (ethers or viem)
 * @returns Viem client
 */
export async function getViemClient(
  provider: any
): Promise<
  PublicClient<Transport, Chain> | WalletClient<Transport, Chain, Account>
> {
  // Handle ethers providers/signers
  if (isEthersProvider(provider) || isEthersSigner(provider)) {
    return adaptEthersToViem(provider);
  }

  // Already viem client
  if (provider?.mode === "publicClient" || provider?.mode === "walletClient") {
    return provider;
  }

  throw new Error("Invalid provider type");
}

/**
 * Check if provider is a wallet client
 * @param provider - Provider to check
 * @returns True if wallet client
 */
export function isWalletClient(
  provider: any
): provider is WalletClient<Transport, Chain, Account> {
  return provider?.mode === "walletClient" || isEthersSigner(provider);
}

/**
 * Check if provider is a public client
 * @param provider - Provider to check
 * @returns True if public client
 */
export function isPublicClient(
  provider: any
): provider is PublicClient<Transport, Chain> {
  return (
    provider?.mode === "publicClient" ||
    (isEthersProvider(provider) && !isEthersSigner(provider))
  );
}

/**
 * Convert bigint to hex string
 * @param value - BigInt value
 * @returns Hex string
 */
export function bigIntToHex(value: bigint): Hex {
  return `0x${value.toString(16)}` as Hex;
}

/**
 * Convert hex string to bigint
 * @param hex - Hex string
 * @returns BigInt value
 */
export function hexToBigInt(hex: Hex): bigint {
  return BigInt(hex);
}

/**
 * Safe parse integer from various formats
 * @param value - Value to parse
 * @returns Parsed integer or undefined
 */
export function safeParseInt(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return undefined;
}
