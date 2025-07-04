"use strict";
/**
 * Compatibility utilities for viem-based SDK
 * Provides helpers for working with viem types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddress = exports.isAddress = exports.formatUnits = exports.parseUnits = void 0;
exports.isValidAddress = isValidAddress;
exports.isValidHex = isValidHex;
exports.isValidHash = isValidHash;
exports.normalizeAddress = normalizeAddress;
exports.normalizeHex = normalizeHex;
exports.getViemClient = getViemClient;
exports.isWalletClient = isWalletClient;
exports.isKernelClient = isKernelClient;
exports.isSmartAccountClient = isSmartAccountClient;
exports.supportsPaymaster = supportsPaymaster;
exports.isPublicClient = isPublicClient;
exports.bigIntToHex = bigIntToHex;
exports.hexToBigInt = hexToBigInt;
exports.safeParseInt = safeParseInt;
const viem_1 = require("viem");
const provider_adapter_1 = require("./provider-adapter");
const migration_helpers_1 = require("./migration-helpers");
Object.defineProperty(exports, "parseUnits", { enumerable: true, get: function () { return migration_helpers_1.parseUnits; } });
Object.defineProperty(exports, "formatUnits", { enumerable: true, get: function () { return migration_helpers_1.formatUnits; } });
Object.defineProperty(exports, "isAddress", { enumerable: true, get: function () { return migration_helpers_1.isAddress; } });
Object.defineProperty(exports, "getAddress", { enumerable: true, get: function () { return migration_helpers_1.getAddress; } });
/**
 * Check if a value is a valid address
 * @param value - Value to check
 * @returns True if valid address
 */
function isValidAddress(value) {
    return typeof value === "string" && (0, viem_1.isAddress)(value);
}
/**
 * Check if a value is a valid hex string
 * @param value - Value to check
 * @returns True if valid hex
 */
function isValidHex(value) {
    return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}
/**
 * Check if a value is a valid hash
 * @param value - Value to check
 * @returns True if valid hash
 */
function isValidHash(value) {
    return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}
/**
 * Normalize address to checksummed format
 * @param address - Address to normalize
 * @returns Checksummed address
 */
function normalizeAddress(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
    }
    return address;
}
/**
 * Normalize hex string
 * @param hex - Hex string to normalize
 * @returns Normalized hex
 */
function normalizeHex(hex) {
    if (!hex.startsWith("0x")) {
        hex = "0x" + hex;
    }
    if (!isValidHex(hex)) {
        throw new Error(`Invalid hex: ${hex}`);
    }
    return hex;
}
/**
 * Get viem client from any provider type
 * @param provider - Provider (ethers or viem)
 * @returns Viem client
 */
async function getViemClient(provider) {
    // Handle ethers providers/signers
    if ((0, provider_adapter_1.isEthersProvider)(provider) || (0, provider_adapter_1.isEthersSigner)(provider)) {
        return (0, provider_adapter_1.adaptEthersToViem)(provider);
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
function isWalletClient(provider) {
    return provider?.mode === "walletClient" || (0, provider_adapter_1.isEthersSigner)(provider);
}
/**
 * Check if provider is a KernelClient from ZeroDev
 * @param provider - Provider to check
 * @returns True if KernelClient
 */
function isKernelClient(provider) {
    return !!(provider &&
        typeof provider === "object" &&
        (provider.kernelVersion ||
            provider.account?.type === "kernel" ||
            provider.paymaster ||
            (provider.account && provider.sendTransaction && provider.writeContract)));
}
/**
 * Check if provider supports smart account features (KernelClient)
 * @param provider - Provider to check
 * @returns True if smart account client
 */
function isSmartAccountClient(provider) {
    return isKernelClient(provider);
}
/**
 * Check if provider supports paymaster (gas sponsorship)
 * @param provider - Provider to check
 * @returns True if supports paymaster
 */
function supportsPaymaster(provider) {
    return !!(isKernelClient(provider) &&
        (provider.paymaster || provider.account?.paymaster));
}
/**
 * Check if provider is a public client
 * @param provider - Provider to check
 * @returns True if public client
 */
function isPublicClient(provider) {
    return (provider?.mode === "publicClient" ||
        ((0, provider_adapter_1.isEthersProvider)(provider) && !(0, provider_adapter_1.isEthersSigner)(provider)));
}
/**
 * Convert bigint to hex string
 * @param value - BigInt value
 * @returns Hex string
 */
function bigIntToHex(value) {
    return `0x${value.toString(16)}`;
}
/**
 * Convert hex string to bigint
 * @param hex - Hex string
 * @returns BigInt value
 */
function hexToBigInt(hex) {
    return BigInt(hex);
}
/**
 * Safe parse integer from various formats
 * @param value - Value to parse
 * @returns Parsed integer or undefined
 */
function safeParseInt(value) {
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
