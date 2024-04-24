import { ethers } from "ethers";
import { GrantArgs } from "../types/allo";
import { NFTStorage } from "nft.storage";
export declare class Allo {
    private contract;
    private static ipfsClient;
    constructor(signer: ethers.Signer, ipfsStorage: NFTStorage);
    saveAndGetCID(data: any): Promise<import("nft.storage").CIDString>;
    encodeStrategyInitData(applicationStart: number, applicationEnd: number, roundStart: number, roundEnd: number, payoutToken: string): Promise<string>;
    createGrant(args: GrantArgs): Promise<{
        poolId: any;
        txHash: any;
    }>;
}
