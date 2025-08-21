import { ethers } from "ethers";
export declare class AlloBase {
    private signer;
    private contract;
    private allo;
    private pinataJWTToken;
    constructor(signer: ethers.Signer, pinataJWTToken: string, chainId: number);
    saveAndGetCID(data: any, pinataMetadata?: {
        name: string;
    }): Promise<any>;
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<string>;
    createGrant(args: any, callback?: Function): Promise<{
        poolId: string;
        txHash: string;
    }>;
    updatePoolMetadata(poolId: string, poolMetadata: any, callback?: Function): Promise<any>;
}
