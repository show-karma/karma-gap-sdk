"use strict";
/**
 * Migration helpers for converting ethers types to viem
 * Provides utilities for backward compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethersBigNumberToBigInt = ethersBigNumberToBigInt;
exports.ethersAddressToViem = ethersAddressToViem;
exports.ethersTransactionToViem = ethersTransactionToViem;
exports.ethersReceiptToViem = ethersReceiptToViem;
exports.ethersHexToViem = ethersHexToViem;
exports.ethersUnitsToViem = ethersUnitsToViem;
exports.formatBigInt = formatBigInt;
exports.isEthersBigNumber = isEthersBigNumber;
exports.isEthersTransaction = isEthersTransaction;
exports.parseUnits = parseUnits;
exports.formatUnits = formatUnits;
exports.isAddress = isAddress;
exports.getAddress = getAddress;
const viem_1 = require("viem");
/**
 * Convert ethers BigNumber to bigint
 * @param value - Ethers BigNumber or compatible value
 * @returns bigint value
 */
function ethersBigNumberToBigInt(value) {
    if (typeof value === "bigint") {
        return value;
    }
    if (value?._isBigNumber || value?.type === "BigNumber") {
        return BigInt(value.toString());
    }
    if (typeof value === "string" || typeof value === "number") {
        return BigInt(value);
    }
    return 0n;
}
/**
 * Convert ethers address to viem Address
 * @param address - Ethers address format
 * @returns Viem Address type
 */
function ethersAddressToViem(address) {
    if (!address)
        return undefined;
    // Ensure it's a valid hex address
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        throw new Error(`Invalid address format: ${address}`);
    }
    return address;
}
/**
 * Convert ethers transaction to viem TransactionRequest
 * @param tx - Ethers transaction object
 * @returns Viem TransactionRequest
 */
function ethersTransactionToViem(tx) {
    const viemTx = {};
    if (tx.to)
        viemTx.to = ethersAddressToViem(tx.to);
    if (tx.from)
        viemTx.from = ethersAddressToViem(tx.from);
    if (tx.data)
        viemTx.data = tx.data;
    if (tx.value)
        viemTx.value = ethersBigNumberToBigInt(tx.value);
    if (tx.gasLimit || tx.gas)
        viemTx.gas = ethersBigNumberToBigInt(tx.gasLimit || tx.gas);
    if (tx.gasPrice)
        viemTx.gasPrice = ethersBigNumberToBigInt(tx.gasPrice);
    if (tx.maxFeePerGas)
        viemTx.maxFeePerGas = ethersBigNumberToBigInt(tx.maxFeePerGas);
    if (tx.maxPriorityFeePerGas)
        viemTx.maxPriorityFeePerGas = ethersBigNumberToBigInt(tx.maxPriorityFeePerGas);
    if (tx.nonce !== undefined)
        viemTx.nonce = Number(tx.nonce);
    return viemTx;
}
/**
 * Convert ethers transaction receipt to viem format
 * @param receipt - Ethers transaction receipt
 * @returns Viem-compatible receipt
 */
function ethersReceiptToViem(receipt) {
    return {
        blockHash: receipt.blockHash,
        blockNumber: BigInt(receipt.blockNumber || 0),
        contractAddress: ethersAddressToViem(receipt.contractAddress),
        cumulativeGasUsed: ethersBigNumberToBigInt(receipt.cumulativeGasUsed),
        effectiveGasPrice: ethersBigNumberToBigInt(receipt.effectiveGasPrice || receipt.gasPrice),
        from: ethersAddressToViem(receipt.from),
        gasUsed: ethersBigNumberToBigInt(receipt.gasUsed),
        logs: receipt.logs?.map((log) => ({
            address: ethersAddressToViem(log.address),
            blockHash: log.blockHash,
            blockNumber: BigInt(log.blockNumber || 0),
            data: log.data,
            logIndex: Number(log.logIndex || 0),
            removed: Boolean(log.removed),
            topics: log.topics,
            transactionHash: log.transactionHash,
            transactionIndex: Number(log.transactionIndex || 0),
        })) || [],
        logsBloom: receipt.logsBloom,
        status: receipt.status === 1 ? "success" : "reverted",
        to: ethersAddressToViem(receipt.to),
        transactionHash: receipt.transactionHash,
        transactionIndex: Number(receipt.transactionIndex || 0),
        type: receipt.type || "legacy",
    };
}
/**
 * Convert ethers hex string to viem Hex type
 * @param hex - Ethers hex string
 * @returns Viem Hex type
 */
function ethersHexToViem(hex) {
    if (!hex)
        return undefined;
    // Ensure it starts with 0x
    if (!hex.startsWith("0x")) {
        hex = "0x" + hex;
    }
    // Validate hex format
    if (!/^0x[0-9a-fA-F]*$/.test(hex)) {
        throw new Error(`Invalid hex format: ${hex}`);
    }
    return hex;
}
/**
 * Convert ethers units to viem
 * @param value - Value in ethers format
 * @param unit - Unit name (ether, gwei, etc.)
 * @returns bigint value in wei
 */
function ethersUnitsToViem(value, unit = "ether") {
    const stringValue = value.toString();
    switch (unit.toLowerCase()) {
        case "ether":
            return (0, viem_1.parseEther)(stringValue);
        case "gwei":
            return (0, viem_1.parseUnits)(stringValue, 9);
        case "wei":
            return BigInt(stringValue);
        default:
            // Try to parse decimals from unit name
            const decimals = parseInt(unit);
            if (!isNaN(decimals)) {
                return (0, viem_1.parseUnits)(stringValue, decimals);
            }
            throw new Error(`Unknown unit: ${unit}`);
    }
}
/**
 * Format bigint to human-readable format
 * @param value - bigint value in wei
 * @param unit - Unit to format to
 * @returns Formatted string
 */
function formatBigInt(value, unit = "ether") {
    switch (unit.toLowerCase()) {
        case "ether":
            return (0, viem_1.formatEther)(value);
        case "gwei":
            return (0, viem_1.formatUnits)(value, 9);
        case "wei":
            return value.toString();
        default:
            const decimals = parseInt(unit);
            if (!isNaN(decimals)) {
                return (0, viem_1.formatUnits)(value, decimals);
            }
            throw new Error(`Unknown unit: ${unit}`);
    }
}
/**
 * Type guard to check if value is an ethers BigNumber
 */
function isEthersBigNumber(value) {
    return value?._isBigNumber === true || value?.type === "BigNumber";
}
/**
 * Type guard to check if value is an ethers transaction
 */
function isEthersTransaction(tx) {
    return (tx &&
        (isEthersBigNumber(tx.gasLimit) ||
            isEthersBigNumber(tx.value) ||
            isEthersBigNumber(tx.gasPrice) ||
            tx._isBigNumber !== undefined));
}
/**
 * Unified parseUnits function
 */
function parseUnits(value, decimals) {
    if (decimals === 18) {
        return (0, viem_1.parseEther)(value);
    }
    return (0, viem_1.parseUnits)(value, decimals);
}
/**
 * Unified formatUnits function
 */
function formatUnits(value, decimals) {
    if (decimals === 18) {
        return (0, viem_1.formatEther)(BigInt(value.toString()));
    }
    return (0, viem_1.formatUnits)(BigInt(value.toString()), decimals);
}
/**
 * Unified isAddress function
 */
function isAddress(address) {
    return (0, viem_1.isAddress)(address);
}
/**
 * Unified getAddress function (checksum address)
 */
function getAddress(address) {
    return (0, viem_1.getAddress)(address);
}
