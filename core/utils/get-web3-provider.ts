import { ethers } from "ethers";
import { GAPRpcConfig, SupportedChainId } from "../types";

/**
 * Global provider cache keyed by "chainId:rpcUrl" to allow caching
 * while supporting different RPC URLs for the same chain.
 */
const providers: Map<string, ethers.JsonRpcProvider> = new Map();

/**
 * Validate that a string is a valid URL.
 * @internal
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
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
export const getWeb3Provider = (
  chainId: number,
  config: GAPRpcConfig
): ethers.JsonRpcProvider => {
  const rpcUrl = config[chainId as SupportedChainId];

  if (!rpcUrl) {
    throw new Error(
      `RPC URL not configured for chain ${chainId}. ` +
        `Please provide an RPC URL in the rpcUrls configuration when initializing GAP.`
    );
  }

  if (!isValidUrl(rpcUrl)) {
    throw new Error(
      `Invalid RPC URL for chain ${chainId}: "${rpcUrl}". ` +
        `Please provide a valid URL (e.g., "https://mainnet.infura.io/v3/YOUR_KEY").`
    );
  }

  const cacheKey = `${chainId}:${rpcUrl}`;
  let provider = providers.get(cacheKey);
  if (!provider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    providers.set(cacheKey, provider);
  }
  return provider;
};

/**
 * Clear all cached providers.
 * Useful for testing or when reconfiguring the SDK.
 * @internal - This is an internal function, not part of the public API.
 */
export const clearProviderCache = (): void => {
  providers.clear();
};
