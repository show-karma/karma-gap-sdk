import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { CommunityDetails, ICommunityDetails } from "../types/attestations";
import { Project } from "./Project";
import { MultiAttestPayload } from "core/types";
export interface ICommunity {
    community: true;
}
export declare class Community extends Attestation<ICommunity> {
    projects: Project[];
    details?: CommunityDetails;
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param refIdx
     */
    multiAttestPayload(): MultiAttestPayload;
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    attest(signer: SignerOrProvider, details?: ICommunityDetails): Promise<void>;
}
