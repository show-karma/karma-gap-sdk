import { ethers } from "ethers";
import { ProfileMetadata } from "../types/allo";
export declare class AlloRegistry {
    private contract;
    private pinataJWTToken;
    constructor(signer: ethers.Signer, pinataJWTToken: string);
    saveAndGetCID(data: any, pinataMetadata?: {
        name: string;
    }): Promise<any>;
    createProgram(nonce: number, name: string, profileMetadata: ProfileMetadata, owner: string, members: string[]): Promise<{
        profileId: any;
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, profileMetadata: ProfileMetadata): Promise<any>;
}
