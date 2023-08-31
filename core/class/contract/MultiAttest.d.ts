import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Hex, MultiAttestData } from "core/types";
export declare class MultiAttest {
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static send(signer: SignerOrProvider, payload: MultiAttestData[]): Promise<Hex[]>;
}
