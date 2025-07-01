"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEthersProvider = isEthersProvider;
exports.isViemPublicClient = isViemPublicClient;
exports.isViemWalletClient = isViemWalletClient;
exports.createProviderAdapter = createProviderAdapter;
const ethers_1 = require("ethers");
/**
 * Check if the provider is an ethers provider
 */
function isEthersProvider(provider) {
    return (provider?._isProvider || provider?.constructor?.name === "JsonRpcProvider");
}
/**
 * Check if the provider is a viem public client
 */
function isViemPublicClient(client) {
    return client?.mode === "publicClient";
}
/**
 * Check if the provider is a viem wallet client
 */
function isViemWalletClient(client) {
    return client?.mode === "walletClient";
}
/**
 * Adapter factory to create a unified provider interface
 */
function createProviderAdapter(provider) {
    if (isEthersProvider(provider)) {
        return {
            type: "ethers",
            provider,
            signer: provider instanceof ethers_1.Wallet ? provider : undefined,
        };
    }
    if (isViemPublicClient(provider)) {
        return {
            type: "viem",
            publicClient: provider,
        };
    }
    if (isViemWalletClient(provider)) {
        return {
            type: "viem",
            publicClient: provider, // Wallet clients can also read
            walletClient: provider,
        };
    }
    throw new Error("Unsupported provider type. Must be ethers or viem provider.");
}
