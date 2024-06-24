import { ProfileMetadata } from "../types/allo";
import { NFTStorage } from "nft.storage";
import { SignerOrProvider } from "core/types";
export declare class AlloRegistry {
    private contract;
    private static ipfsClient;
    constructor(signer: SignerOrProvider, ipfsStorage: NFTStorage);
    saveAndGetCID(data: any): Promise<import("nft.storage").CIDString>;
    createProgram(nonce: number, name: string, profileMetadata: ProfileMetadata, owner: string, members: string[]): Promise<{
        profileId: any;
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, profileMetadata: ProfileMetadata): Promise<any>;
    isMemberOf(profileId: string, address: string): Promise<any>;
}
