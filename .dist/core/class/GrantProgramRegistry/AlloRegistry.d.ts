import { ethers } from "ethers";
export declare class AlloRegistry {
    private contract;
    constructor(signer: ethers.Signer);
    createProgram(nonce: number, name: string, metadataCid: string, owner: string, members: string[]): Promise<{
        profileId: any;
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, metadataCid: string): Promise<any>;
}
