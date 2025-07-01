/**
 * Compatibility module for gradual migration from ethers to viem
 * This module provides unified interfaces that work with both libraries
 */
import { Wallet } from "ethers";
import { WalletClient, type Hex } from "viem";
import { UniversalContract } from "./viem-contracts";
import { parseUnits, formatUnits, isAddress, getAddress, getChainId, sendTransaction, waitForTransaction } from "./migration-helpers";
export { parseUnits, formatUnits, isAddress, getAddress, getChainId, sendTransaction, waitForTransaction, UniversalContract, };
/**
 * Type that can be either ethers or viem signer
 */
export type UniversalSigner = Wallet | WalletClient;
/**
 * Type that can be either ethers or viem provider
 */
export type UniversalProvider = any;
/**
 * Check if a signer is an ethers Wallet
 */
export declare function isEthersWallet(signer: any): signer is Wallet;
/**
 * Get the address from any signer type
 */
export declare function getSignerAddress(signer: UniversalSigner): Promise<Hex>;
/**
 * Check if the signer/provider supports a specific chain
 */
export declare function supportsChain(signerOrProvider: any, chainId: number): Promise<boolean>;
