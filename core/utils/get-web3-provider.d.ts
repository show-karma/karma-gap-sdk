import { ethers } from "ethers";
import { GAPRpcConfig } from "../types";
/**
 * Get a Web3 provider for a specific chain ID using the provided RPC configuration.
 *
 * @param chainId - The chain ID to get a provider for
 * @param config - RPC URL configuration mapping chain IDs to RPC URLs
 * @returns An ethers JsonRpcProvider for the specified chain
 * @throws Error if no RPC URL is configured for the chain ID or if the URL is invalid
 */
export declare const getWeb3Provider: (chainId: number, config: GAPRpcConfig) => ethers.JsonRpcProvider;
/**
 * Clear all cached providers.
 * Useful for testing or when reconfiguring the SDK.
 * @internal - This is an internal function, not part of the public API.
 */
export declare const clearProviderCache: () => void;
