import { ethers } from "ethers";
import { ProfileMetadata } from "../types/allo";
import pinataSDK from "@pinata/sdk";
export declare class AlloRegistry {
    private contract;
    private static ipfsClient;
    constructor(signer: ethers.Signer, ipfsStorage: pinataSDK);
    saveAndGetCID(data: any): Promise<string>;
    createProgram(nonce: number, name: string, profileMetadata: ProfileMetadata, owner: string, members: string[]): Promise<{
        profileId: any;
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, profileMetadata: ProfileMetadata): Promise<any>;
}
