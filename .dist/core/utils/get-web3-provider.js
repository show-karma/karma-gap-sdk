"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearProviderCache = exports.getWeb3Provider = void 0;
const ethers_1 = require("ethers");
/**
 * Global provider cache keyed by "chainId:rpcUrl" to allow caching
 * while supporting different RPC URLs for the same chain.
 */
const providers = new Map();
/**
 * Validate that a string is a valid URL.
 * @internal
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
/**
 * Get a Web3 provider for a specific chain ID using the provided RPC configuration.
 *
 * @param chainId - The chain ID to get a provider for
 * @param config - RPC URL configuration mapping chain IDs to RPC URLs
 * @returns An ethers JsonRpcProvider for the specified chain
 * @throws Error if no RPC URL is configured for the chain ID or if the URL is invalid
 */
const getWeb3Provider = (chainId, config) => {
    const rpcUrl = config[chainId];
    if (!rpcUrl) {
        throw new Error(`RPC URL not configured for chain ${chainId}. ` +
            `Please provide an RPC URL in the rpcUrls configuration when initializing GAP.`);
    }
    if (!isValidUrl(rpcUrl)) {
        throw new Error(`Invalid RPC URL for chain ${chainId}: "${rpcUrl}". ` +
            `Please provide a valid URL (e.g., "https://mainnet.infura.io/v3/YOUR_KEY").`);
    }
    const cacheKey = `${chainId}:${rpcUrl}`;
    let provider = providers.get(cacheKey);
    if (!provider) {
        provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        providers.set(cacheKey, provider);
    }
    return provider;
};
exports.getWeb3Provider = getWeb3Provider;
/**
 * Clear all cached providers.
 * Useful for testing or when reconfiguring the SDK.
 * @internal - This is an internal function, not part of the public API.
 */
const clearProviderCache = () => {
    providers.clear();
};
exports.clearProviderCache = clearProviderCache;
