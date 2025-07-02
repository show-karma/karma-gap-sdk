"use strict";
/**
 * Unified types for SDK - using viem types directly
 * These types provide strong typing throughout the SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
exports.normalizeReceipt = normalizeReceipt;
exports.isHex = isHex;
exports.isHash = isHash;
/**
 * Helper to create a Transaction object from a hash
 * Ensures strong typing
 */
function createTransaction(hash) {
    return {
        hash: hash,
        type: "legacy", // Default type for compatibility
    };
}
/**
 * Helper to normalize transaction receipt
 * Converts viem receipt to our interface
 */
function normalizeReceipt(receipt) {
    return {
        ...receipt,
        hash: receipt.transactionHash,
    };
}
/**
 * Type guard to check if a value is a valid Hex string
 */
function isHex(value) {
    return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}
/**
 * Type guard to check if a value is a valid Hash
 */
function isHash(value) {
    return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}
