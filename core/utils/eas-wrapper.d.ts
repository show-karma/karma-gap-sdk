import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "../types";
/**
 * Creates an EAS instance that's compatible with both ethers and viem
 *
 * Since EAS SDK only supports ethers, we need to wrap viem clients
 * to make them compatible with EAS.
 */
export declare function createEASInstance(contractAddress: string): EAS;
/**
 * Connects a signer/provider to an EAS instance
 *
 * If the signer is a viem client, it wraps it in an ethers-compatible adapter.
 * If it's already an ethers signer, it connects directly.
 */
export declare function connectEAS(eas: EAS, signerOrProvider: SignerOrProvider): EAS;
