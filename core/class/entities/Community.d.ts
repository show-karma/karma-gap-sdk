import { Attestation } from "../Attestation";
import { CommunityDetails, ICommunityDetails } from "../types/attestations";
import { Project } from "./Project";
import { MultiAttestPayload, SignerOrProvider, TNetwork } from "core/types";
import { Grant } from "./Grant";
import { ICommunityResponse } from "../karma-indexer/api/types";
export interface ICommunity {
    community: true;
}
export declare class Community extends Attestation<ICommunity> {
    projects: Project[];
    grants: Grant[];
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
    multiAttestPayload(): Promise<MultiAttestPayload>;
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    attest(signer: SignerOrProvider, details?: ICommunityDetails, callback?: Function): Promise<void>;
    static from(attestations: ICommunityResponse[], network: TNetwork): Community[];
}
