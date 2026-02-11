import { ethers } from "ethers";
export declare class AlloBase {
    private signer;
    private contract;
    private allo;
    constructor(signer: ethers.Signer, chainId: number);
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<string>;
    createGrant(args: any & {
        metadataCid: string;
    }, callback?: Function): Promise<{
        poolId: string;
        txHash: string;
    }>;
    updatePoolMetadata(poolId: string, metadataCid: string, callback?: Function): Promise<any>;
}
