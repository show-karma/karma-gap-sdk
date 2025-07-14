import { type PublicClient, type WalletClient, type Transport, type Chain, type Account } from "viem";
/**
 * Convert ethers provider to viem public client
 * @param provider - Ethers provider instance
 * @returns Viem public client
 */
export declare function ethersProviderToViemClient(provider: any): Promise<PublicClient<Transport, Chain>>;
/**
 * Convert ethers signer to viem wallet client
 * @param signer - Ethers signer instance
 * @returns Viem wallet client
 */
export declare function ethersSignerToViemClient(signer: any): Promise<WalletClient<Transport, Chain, Account>>;
