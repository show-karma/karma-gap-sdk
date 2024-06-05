import { ethers } from "ethers";
import { NFTStorage } from "nft.storage";
export declare class AlloBase {
    private signer;
    private contract;
    private static ipfsClient;
    private allo;
    constructor(signer: ethers.Signer, ipfsStorage: NFTStorage, chainId: number);
    saveAndGetCID(data: any): Promise<import("nft.storage").CIDString>;
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<string>;
    createGrant(args: any): Promise<{
        poolId: string;
        txHash: string;
    }>;
    updatePoolMetadata(poolId: string, poolMetadata: any): Promise<any>;
}
