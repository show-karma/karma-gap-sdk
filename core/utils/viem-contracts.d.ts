/**
 * Universal contract interface for viem
 * Provides a unified way to interact with contracts using viem
 */
import { type Abi, type Address, type Hash, type Hex } from "viem";
/**
 * Universal contract interface that works with viem
 * Provides strong typing for contract interactions
 */
export interface UniversalContract {
    address: Address;
    abi: Abi;
    /**
     * Read data from the contract (view/pure functions)
     */
    read(functionName: string, args?: readonly unknown[]): Promise<unknown>;
    /**
     * Write data to the contract (non-payable functions)
     */
    write(functionName: string, args?: readonly unknown[], options?: any): Promise<Hash>;
    /**
     * Estimate gas for contract functions
     */
    estimateGas(functionName: string, args?: readonly unknown[]): Promise<bigint>;
    /**
     * Encode function data
     */
    encodeFunctionData(functionName: string, args?: readonly unknown[]): Hex;
    /**
     * Decode function result
     */
    decodeFunctionResult(functionName: string, data: Hex): unknown;
}
/**
 * Create a universal contract instance
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param provider - Viem client or ethers provider/signer
 * @returns Universal contract instance
 */
export declare function createUniversalContract(address: string, abi: Abi, provider: any): Promise<UniversalContract>;
/**
 * Helper to check if a provider supports write operations
 */
export declare function supportsWrites(provider: any): boolean;
