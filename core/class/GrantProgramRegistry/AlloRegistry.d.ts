import type { SignerOrProvider } from "../../types";
import { ProfileMetadata } from "../types/allo";
export declare class AlloRegistry {
    private contract;
    private pinataJWTToken;
    private signer;
    constructor(signer: SignerOrProvider, pinataJWTToken: string, chainId: number);
    private getContract;
    saveAndGetCID(data: any, pinataMetadata?: {
        name: string;
    }): Promise<any>;
    createProgram(nonce: number, name: string, profileMetadata: ProfileMetadata, owner: string, members: string[]): Promise<{
        txHash: any;
    }>;
    updateProgramMetadata(profileId: string, profileMetadata: ProfileMetadata): Promise<import("viem").TransactionReceipt>;
}
