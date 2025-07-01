import { PublicClient, WalletClient, Chain, Account } from "viem";
/**
 * Get or create a public client for a specific chain
 */
export declare function getPublicClient(chainId: number): PublicClient;
/**
 * Create a wallet client from a private key
 */
export declare function createWalletFromPrivateKey(privateKey: `0x${string}`, chainId: number): {
    account: Account;
    walletClient: WalletClient;
};
/**
 * Get chain configuration by ID
 */
export declare function getChain(chainId: number): Chain;
/**
 * Type exports for convenience
 */
export type { PublicClient, WalletClient, Chain, Account, Transport, } from "viem";
