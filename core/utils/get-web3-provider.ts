import { ethers } from "ethers";
import { GAPRpcConfig } from "../types";

const providers: Record<number, ethers.JsonRpcProvider> = {};
let rpcUrlRegistry: Record<number, string> = {};

/**
 * Register RPC URLs for use by getWeb3Provider.
 * This is called internally by GAP when initialized with rpcUrls.
 *
 * @param config - RPC URL configuration mapping chain IDs to RPC URLs
 */
export const registerRpcUrls = (config: GAPRpcConfig): void => {
  rpcUrlRegistry = { ...rpcUrlRegistry, ...config };
};

/**
 * Clear all registered RPC URLs and cached providers.
 * Useful for testing or when reconfiguring the SDK.
 */
export const clearRpcRegistry = (): void => {
  rpcUrlRegistry = {};
  Object.keys(providers).forEach((key) => delete providers[Number(key)]);
};

/**
 * Get a Web3 provider for a specific chain ID.
 *
 * @param chainId - The chain ID to get a provider for
 * @returns An ethers JsonRpcProvider for the specified chain
 * @throws Error if no RPC URL is configured for the chain ID
 */
export const getWeb3Provider = (chainId: number): ethers.JsonRpcProvider => {
  const rpcUrl = rpcUrlRegistry[chainId];

  if (!rpcUrl) {
    throw new Error(`RPC URL not configured for chain ${chainId}`);
  }

  if (!providers[chainId]) {
    providers[chainId] = new ethers.JsonRpcProvider(rpcUrl);
  }
  return providers[chainId];
};
