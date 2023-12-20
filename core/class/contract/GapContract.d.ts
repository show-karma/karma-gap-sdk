import { Hex, RawAttestationPayload, RawMultiAttestPayload, SignerOrProvider } from 'core/types';
import { MultiRevocationRequest } from '@ethereum-attestation-service/eas-sdk';
export declare class GapContract {
    static nonces: {
        [key: string]: number;
    };
    /**
     * Signs a message for the delegated attestation.
     * @param signer
     * @param payload
     * @returns r,s,v signature
     */
    private static signAttestation;
    /**
     * Returns the r, s, v values of a signature
     * @param signature
     * @returns
     */
    private static getRSV;
    static getSignerAddress(signer: SignerOrProvider): Promise<string>;
    /**
     * Get nonce for the transaction
     * @param address
     * @returns
     */
    private static getNonce;
    /**
     * Send a single attestation
     * @param signer
     * @param payload
     * @returns
     */
    static attest(signer: SignerOrProvider, payload: RawAttestationPayload): Promise<`0x${string}`>;
    static attestBySig(signer: SignerOrProvider, payload: RawAttestationPayload): Promise<`0x${string}`>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiAttest(signer: SignerOrProvider, payload: RawMultiAttestPayload[]): Promise<Hex[]>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiAttestBySig(signer: SignerOrProvider, payload: RawMultiAttestPayload[]): Promise<Hex[]>;
    static multiRevoke(signer: SignerOrProvider, payload: MultiRevocationRequest[]): Promise<any>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiRevokeBySig(signer: SignerOrProvider, payload: MultiRevocationRequest[]): Promise<void>;
    /**
     * Transfer the ownership of an attestation
     * @param signer
     * @param projectUID
     * @param newOwner
     * @returns
     */
    static transferProjectOwnership(signer: SignerOrProvider, projectUID: Hex, newOwner: Hex, projectChainId: number): Promise<any>;
    /**
     * Check if the signer is the owner of the project
     * @param signer
     * @param projectUID
     * @returns
     */
    static isProjectOwner(signer: SignerOrProvider, projectUID: Hex, projectChainId: number): Promise<boolean>;
    private static getTransactionLogs;
}
