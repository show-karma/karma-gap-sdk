"use strict";
/**
 * Unified types for SDK - compatible with both ethers and viem
 * These types replace direct ethers dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
exports.normalizeReceipt = normalizeReceipt;
/**
 * Helper to create a Transaction object from a hash
 */
function createTransaction(hash) {
    return { hash };
}
/**
 * Helper to normalize transaction receipt
 */
function normalizeReceipt(receipt) {
    return {
        hash: receipt.hash || receipt.transactionHash,
        transactionHash: receipt.transactionHash || receipt.hash,
        transactionIndex: receipt.transactionIndex || receipt.index,
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        contractAddress: receipt.contractAddress,
        status: receipt.status,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        logs: receipt.logs,
        logsBloom: receipt.logsBloom,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
    };
}
