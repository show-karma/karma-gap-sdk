import { type Hex } from "viem";
import { CreatePoolArgs } from "@allo-team/allo-v2-sdk/dist/Allo/types";
import { SignerOrProvider } from "../../types";
export declare class AlloBase {
    private allo;
    private pinataJWTToken;
    private signer;
    private contract;
    private chainId;
    constructor(signer: SignerOrProvider, pinataJWTToken: string, chainId: number);
    private getContract;
    saveAndGetCID(data: any, pinataMetadata?: {
        name: string;
    }): Promise<any>;
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<Hex>;
    encodeFundPool(poolId: number, amount: bigint): Promise<Hex>;
    estimateCreateProgramGas(createPoolArgs: CreatePoolArgs): Promise<bigint>;
    getWalletBalance(): Promise<string>;
    createProgram(createPoolArgs: CreatePoolArgs): Promise<bigint>;
    private getPoolIdFromReceipt;
    private getSignerAddress;
    private getBalance;
    private estimateGas;
    private sendTransaction;
    updatePoolMetadata(poolId: string, poolMetadata: any, callback?: Function): Promise<import("viem").TransactionReceipt>;
}
