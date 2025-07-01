import { PublicClient, WalletClient } from "viem";
import { JsonRpcProvider, Wallet } from "ethers";
/**
 * Provider adapter to support both ethers and viem during migration
 */
export type ProviderAdapter = EthersProviderAdapter | ViemProviderAdapter;
export interface EthersProviderAdapter {
    type: "ethers";
    provider: JsonRpcProvider;
    signer?: Wallet;
}
export interface ViemProviderAdapter {
    type: "viem";
    publicClient: PublicClient;
    walletClient?: WalletClient;
}
/**
 * Check if the provider is an ethers provider
 */
export declare function isEthersProvider(provider: any): provider is JsonRpcProvider;
/**
 * Check if the provider is a viem public client
 */
export declare function isViemPublicClient(client: any): client is PublicClient;
/**
 * Check if the provider is a viem wallet client
 */
export declare function isViemWalletClient(client: any): client is WalletClient;
/**
 * Adapter factory to create a unified provider interface
 */
export declare function createProviderAdapter(provider: any): ProviderAdapter;
