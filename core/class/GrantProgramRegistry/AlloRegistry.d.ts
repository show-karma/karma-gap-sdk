import { ethers } from "ethers";
import { ProfileMetadata } from "../types/allo";
import { NFTStorage } from "nft.storage";
export declare class AlloRegistry {
    private contract;
    private static ipfsClient;
    constructor(signer: ethers.Signer, ipfsStorage: NFTStorage);
    saveAndGetCID(data: any): Promise<import("nft.storage").CIDString>;
    createProgram(nonce: number, name: string, profileMetadata: ProfileMetadata, owner: string, members: string[]): Promise<{
        profileId: any;
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, profileMetadata: ProfileMetadata): Promise<any>;
}
