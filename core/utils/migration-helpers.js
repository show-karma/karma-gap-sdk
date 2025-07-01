"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethersToViemTransaction = ethersToViemTransaction;
exports.viemToEthersReceipt = viemToEthersReceipt;
exports.parseUnits = parseUnits;
exports.formatUnits = formatUnits;
exports.isAddress = isAddress;
exports.getAddress = getAddress;
exports.getChainId = getChainId;
exports.getBlockNumber = getBlockNumber;
exports.sendTransaction = sendTransaction;
exports.waitForTransaction = waitForTransaction;
const viem_1 = require("viem");
const ethers_1 = require("ethers");
const provider_adapter_1 = require("./provider-adapter");
/**
 * Convert ethers transaction to viem format
 */
function ethersToViemTransaction(tx) {
    const viemTx = {
        to: tx.to,
        from: tx.from,
        value: tx.value ? BigInt(tx.value.toString()) : undefined,
        data: tx.data,
        nonce: tx.nonce,
    };
    if (tx.gasLimit)
        viemTx.gas = BigInt(tx.gasLimit.toString());
    if (tx.gasPrice)
        viemTx.gasPrice = BigInt(tx.gasPrice.toString());
    if (tx.maxFeePerGas)
        viemTx.maxFeePerGas = BigInt(tx.maxFeePerGas.toString());
    if (tx.maxPriorityFeePerGas)
        viemTx.maxPriorityFeePerGas = BigInt(tx.maxPriorityFeePerGas.toString());
    return viemTx;
}
/**
 * Convert viem transaction receipt to ethers format
 */
function viemToEthersReceipt(receipt) {
    return {
        to: receipt.to || null,
        from: receipt.from,
        contractAddress: receipt.contractAddress || null,
        blockHash: receipt.blockHash,
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        status: receipt.status === "success" ? 1 : 0,
        gasUsed: receipt.gasUsed.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString() || "0",
    };
}
/**
 * Unified parseUnits function that works with both ethers and viem
 */
function parseUnits(value, decimals) {
    // Always return bigint for consistency with viem
    if (typeof value === "string" && decimals === 18) {
        return (0, viem_1.parseEther)(value);
    }
    return (0, viem_1.parseUnits)(value, decimals);
}
/**
 * Unified formatUnits function that works with both ethers and viem
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
/**
 * Get chain ID from any provider type
 */
async function getChainId(provider) {
    if ((0, provider_adapter_1.isEthersProvider)(provider)) {
        const network = await provider.getNetwork();
        return Number(network.chainId);
    }
    if ((0, provider_adapter_1.isViemPublicClient)(provider) || (0, provider_adapter_1.isViemWalletClient)(provider)) {
        return provider.chain?.id || 1;
    }
    throw new Error("Unsupported provider type");
}
/**
 * Get block number from any provider type
 */
async function getBlockNumber(provider) {
    if ((0, provider_adapter_1.isEthersProvider)(provider)) {
        return provider.getBlockNumber();
    }
    if ((0, provider_adapter_1.isViemPublicClient)(provider)) {
        const block = await provider.getBlockNumber();
        return Number(block);
    }
    throw new Error("Unsupported provider type");
}
/**
 * Send transaction using any signer type
 */
async function sendTransaction(signer, tx) {
    if (signer instanceof ethers_1.Wallet) {
        const ethTx = {
            to: tx.to,
            value: tx.value?.toString(),
            data: tx.data,
            gasLimit: tx.gas?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            maxFeePerGas: tx.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
            nonce: tx.nonce,
        };
        const response = await signer.sendTransaction(ethTx);
        return response.hash;
    }
    if ((0, provider_adapter_1.isViemWalletClient)(signer)) {
        return signer.sendTransaction(tx);
    }
    throw new Error("Unsupported signer type");
}
/**
 * Wait for transaction confirmation
 */
async function waitForTransaction(provider, hash, confirmations) {
    if ((0, provider_adapter_1.isEthersProvider)(provider)) {
        const receipt = await provider.waitForTransaction(hash, confirmations);
        if (!receipt)
            throw new Error("Transaction failed");
        return {
            blockHash: receipt.blockHash,
            blockNumber: BigInt(receipt.blockNumber),
            contractAddress: receipt.contractAddress,
            cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed.toString()),
            effectiveGasPrice: BigInt(receipt.gasPrice?.toString() || "0"),
            from: receipt.from,
            gasUsed: BigInt(receipt.gasUsed.toString()),
            logs: receipt.logs,
            logsBloom: receipt.logsBloom,
            status: receipt.status === 1 ? "success" : "reverted",
            to: receipt.to,
            transactionHash: receipt.hash,
            transactionIndex: receipt.index || 0,
            type: "legacy",
        };
    }
    if ((0, provider_adapter_1.isViemPublicClient)(provider)) {
        return provider.waitForTransactionReceipt({
            hash,
            confirmations,
        });
    }
    throw new Error("Unsupported provider type");
}
