/**
 * Account abstraction utilities for ZeroDev integration
 *
 * This is a placeholder implementation that will be completed
 * once ZeroDev SDK is fully compatible with the latest versions
 */
import type { WalletClient, Hex } from "viem";
export type EntryPointVersion = "v0.6" | "v0.7";
export declare const ENTRYPOINT_ADDRESS_V06: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export declare const ENTRYPOINT_ADDRESS_V07: "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
interface CreateSmartAccountOptions {
    signer: WalletClient;
    chainId: number;
    projectId: string;
    bundlerUrl?: string;
    paymasterUrl?: string;
    entryPointVersion?: EntryPointVersion;
}
interface SmartAccountResult {
    account: any;
    client: any;
}
/**
 * Create a ZeroDev smart account from a signer
 *
 * @note This is a placeholder implementation
 */
export declare function createSmartAccount(options: CreateSmartAccountOptions): Promise<SmartAccountResult>;
/**
 * Send a transaction using the smart account
 *
 * @note This is a placeholder implementation
 */
export declare function sendSmartAccountTransaction(client: any, to: Hex, data: Hex, value?: bigint): Promise<any>;
/**
 * Get the smart account address
 */
export declare function getSmartAccountAddress(account: any): Hex;
export {};
