import { type PublicClient, type WalletClient, type Transport, type Chain, type Account } from "viem";
/**
 * Provider adapter for backward compatibility
 * Converts ethers providers to viem clients
 * This allows existing code using ethers to work with the viem-based SDK
 */
/**
 * Type guard to check if provider is an ethers provider
 */
export declare function isEthersProvider(provider: any): boolean;
/**
 * Type guard to check if signer is an ethers signer
 */
export declare function isEthersSigner(signer: any): boolean;
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
/**
 * Unified adapter that handles both providers and signers
 * @param providerOrSigner - Ethers provider or signer
 * @returns Viem client (public or wallet)
 */
export declare function adaptEthersToViem(providerOrSigner: any): Promise<PublicClient<Transport, Chain> | WalletClient<Transport, Chain, Account>>;
