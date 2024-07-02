import { ethers } from "ethers";
import pinataSDK from "@pinata/sdk";
export declare class AlloBase {
    private signer;
    private contract;
    private static ipfsClient;
    private allo;
    constructor(signer: ethers.Signer, ipfsStorage: pinataSDK, chainId: number);
    saveAndGetCID(data: any): Promise<string>;
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<string>;
    createGrant(args: any): Promise<{
        poolId: string;
        txHash: string;
    }>;
    updatePoolMetadata(poolId: string, poolMetadata: any): Promise<any>;
}
