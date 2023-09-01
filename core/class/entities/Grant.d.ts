import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { GrantDetails, GrantRound } from "../types/attestations";
import { IMilestone, Milestone } from "./Milestone";
import { GapSchema } from "../GapSchema";
import { MultiAttestPayload } from "core/types";
import { Community } from "./Community";
export interface IGrant {
    grant: true;
}
export declare class Grant extends Attestation<IGrant> {
    details?: GrantDetails;
    verified?: boolean;
    round?: GrantRound;
    milestones: Milestone[];
    community: Community;
    verify(signer: SignerOrProvider): Promise<void>;
    /**
     * Add milestones to the grant.
     * @param signer
     * @param milestones
     */
    addMilestones(milestones: IMilestone[]): void;
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param projectIdx
     */
    multiAttestPayload(currentPayload?: MultiAttestPayload, projectIdx?: number): [Attestation<unknown, GapSchema>, import("core/types").MultiAttestData][];
    /**
     * @inheritdoc
     */
    attest(signer: SignerOrProvider): Promise<void>;
    /**
     * Validate if the grant has a valid reference to a community.
     */
    protected assertPayload(): boolean;
}
