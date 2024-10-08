import { Attestation, AttestationArgs } from "../Attestation";
import { AttestationWithTx } from "../types/attestations";
import { GapSchema } from "../GapSchema";
import { MultiAttestPayload, SignerOrProvider, TNetwork } from "core/types";
export interface IContributorProfile {
    name: string;
    aboutMe?: string;
    github?: string;
    twitter?: string;
    linkdin?: number;
}
export declare class ContributorProfile extends Attestation<IContributorProfile> implements IContributorProfile {
    name: string;
    aboutMe?: string;
    github?: string;
    twitter?: string;
    linkdin?: number;
    constructor(data: AttestationArgs<IContributorProfile, GapSchema>);
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
    attest(signer: SignerOrProvider, callback?: Function): Promise<AttestationWithTx>;
    static from(attestation: ContributorProfile, network: TNetwork): ContributorProfile;
}
