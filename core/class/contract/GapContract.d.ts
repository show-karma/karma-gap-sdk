import { MultiRevocationRequest } from "@ethereum-attestation-service/eas-sdk";
import { CallbackStatus, Hex, RawAttestationPayload, RawMultiAttestPayload, SignerOrProvider } from "core/types";
import { Transaction } from "ethers";
import { AttestationWithTx } from "../types/attestations";
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
    static getSignerAddress(signer: SignerOrProvider): Promise<any>;
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
    static attest(signer: SignerOrProvider, payload: RawAttestationPayload, callback?: ((status: CallbackStatus) => void) & ((status: string) => void)): Promise<AttestationWithTx>;
    static attestBySig(signer: SignerOrProvider, payload: RawAttestationPayload): Promise<{
        tx: Transaction[];
        uids: `0x${string}`[];
    }>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiAttest(signer: SignerOrProvider, payload: RawMultiAttestPayload[], callback?: Function): Promise<AttestationWithTx>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiAttestBySig(signer: SignerOrProvider, payload: RawMultiAttestPayload[]): Promise<AttestationWithTx>;
    static multiRevoke(signer: SignerOrProvider, payload: MultiRevocationRequest[]): Promise<AttestationWithTx>;
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static multiRevokeBySig(signer: SignerOrProvider, payload: MultiRevocationRequest[]): Promise<AttestationWithTx>;
    /**
     * Transfer the ownership of an attestation
     * @param signer
     * @param projectUID
     * @param newOwner
     * @returns
     */
    static transferProjectOwnership(signer: SignerOrProvider, projectUID: Hex, newOwner: Hex): Promise<any>;
    /**
     * Check if the signer is the owner of the project
     * @param signer
     * @param projectUID
     * @returns
     */
    static isProjectOwner(signer: SignerOrProvider, projectUID: Hex, projectChainId: number): Promise<boolean>;
    /**
     * Check if the signer is admin of the project
     * @param signer
     * @param projectUID
     * @returns
     */
    static isProjectAdmin(signer: SignerOrProvider, projectUID: Hex, projectChainId: number): Promise<boolean>;
    /**
     * Check if the address is admin of the project
     * @param signer
     * @param address
     * @param projectUID
     * @param projectChainId
     * @returns
     */
    static isAddressAdmin(signer: SignerOrProvider, address: Hex, projectUID: Hex, projectChainId: number): Promise<boolean>;
    private static getTransactionLogs;
    /**
     * Add Project Admin
     * @param signer
     * @param projectUID
     * @param newAdmin
     * @returns
     */
    static addProjectAdmin(signer: SignerOrProvider, projectUID: Hex, newAdmin: Hex): Promise<any>;
    /**
     * RemoveProject Admin
     * @param signer
     * @param projectUID
     * @param newAdmin
     * @returns
     */
    static removeProjectAdmin(signer: SignerOrProvider, projectUID: Hex, oldAdmin: Hex): Promise<any>;
}
