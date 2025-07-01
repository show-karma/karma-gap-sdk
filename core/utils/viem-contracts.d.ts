import { type Abi, type Hex } from "viem";
/**
 * Universal contract interface that works with both ethers and viem
 */
export declare class UniversalContract {
    private ethersContract?;
    private viemContract?;
    private abi;
    private address;
    constructor(address: string, abi: Abi | any[], signerOrProvider: any);
    /**
     * Call a read-only function
     */
    read(functionName: string, args?: any[]): Promise<any>;
    /**
     * Call a write function
     */
    write(functionName: string, args?: any[], options?: any): Promise<Hex>;
    /**
     * Estimate gas for a function call
     */
    estimateGas(functionName: string, args?: any[], options?: any): Promise<bigint>;
    /**
     * Encode function data
     */
    encodeFunctionData(functionName: string, args?: any[]): Hex;
    /**
     * Decode function result
     */
    decodeFunctionResult(functionName: string, data: Hex): any;
    /**
     * Get the contract address
     */
    get contractAddress(): Hex;
    /**
     * Check if using ethers
     */
    get isEthers(): boolean;
    /**
     * Check if using viem
     */
    get isViem(): boolean;
}
