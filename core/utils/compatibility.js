"use strict";
/**
 * Compatibility module for gradual migration from ethers to viem
 * This module provides unified interfaces that work with both libraries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalContract = exports.waitForTransaction = exports.sendTransaction = exports.getChainId = exports.getAddress = exports.isAddress = exports.formatUnits = exports.parseUnits = void 0;
exports.isEthersWallet = isEthersWallet;
exports.getSignerAddress = getSignerAddress;
exports.supportsChain = supportsChain;
const ethers_1 = require("ethers");
const provider_adapter_1 = require("./provider-adapter");
const viem_contracts_1 = require("./viem-contracts");
Object.defineProperty(exports, "UniversalContract", { enumerable: true, get: function () { return viem_contracts_1.UniversalContract; } });
const migration_helpers_1 = require("./migration-helpers");
Object.defineProperty(exports, "parseUnits", { enumerable: true, get: function () { return migration_helpers_1.parseUnits; } });
Object.defineProperty(exports, "formatUnits", { enumerable: true, get: function () { return migration_helpers_1.formatUnits; } });
Object.defineProperty(exports, "isAddress", { enumerable: true, get: function () { return migration_helpers_1.isAddress; } });
Object.defineProperty(exports, "getAddress", { enumerable: true, get: function () { return migration_helpers_1.getAddress; } });
Object.defineProperty(exports, "getChainId", { enumerable: true, get: function () { return migration_helpers_1.getChainId; } });
Object.defineProperty(exports, "sendTransaction", { enumerable: true, get: function () { return migration_helpers_1.sendTransaction; } });
Object.defineProperty(exports, "waitForTransaction", { enumerable: true, get: function () { return migration_helpers_1.waitForTransaction; } });
/**
 * Check if a signer is an ethers Wallet
 */
function isEthersWallet(signer) {
    return signer instanceof ethers_1.Wallet;
}
/**
 * Get the address from any signer type
 */
async function getSignerAddress(signer) {
    if (isEthersWallet(signer)) {
        return (await signer.getAddress());
    }
    if ((0, provider_adapter_1.isViemWalletClient)(signer)) {
        if (!signer.account)
            throw new Error("No account found in wallet client");
        return signer.account.address;
    }
    throw new Error("Unsupported signer type");
}
/**
 * Check if the signer/provider supports a specific chain
 */
async function supportsChain(signerOrProvider, chainId) {
    try {
        const currentChainId = await (0, migration_helpers_1.getChainId)(signerOrProvider);
        return currentChainId === chainId;
    }
    catch {
        return false;
    }
}
