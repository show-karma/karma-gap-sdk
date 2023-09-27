import { Hex, RawAttestationPayload, RawMultiAttestPayload, SignerOrProvider } from "core/types";
export declare class GapContract {
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
    private static getSignerAddress;
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
    private static getTransactionLogs;
}
