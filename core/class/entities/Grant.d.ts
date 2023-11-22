import { Attestation } from '../Attestation';
import { GrantDetails, GrantRound, GrantUpdate, IGrantUpdate, GrantCompleted } from '../types/attestations';
import { IMilestone, Milestone } from './Milestone';
import { GapSchema } from '../GapSchema';
import { Hex, MultiAttestPayload, SignerOrProvider } from 'core/types';
import { Community } from './Community';
interface _Grant extends Grant {
}
export interface IGrant {
    communityUID: Hex;
}
export interface ISummaryProject {
    title: string;
    slug?: string;
    uid: Hex;
}
export declare class Grant extends Attestation<IGrant> {
    details?: GrantDetails;
    communityUID: Hex;
    verified?: boolean;
    round?: GrantRound;
    milestones: Milestone[];
    community: Community;
    updates: GrantUpdate[];
    members: string[];
    completed?: GrantCompleted;
    project?: ISummaryProject;
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
    multiAttestPayload(currentPayload?: MultiAttestPayload, projectIdx?: number): Promise<[Attestation<unknown, GapSchema>, import("core/types").RawMultiAttestPayload][]>;
    /**
     * @inheritdoc
     */
    attest(signer: SignerOrProvider): Promise<void>;
    attestUpdate(signer: SignerOrProvider, data: IGrantUpdate): Promise<void>;
    complete(signer: SignerOrProvider, data: IGrantUpdate): Promise<void>;
    /**
     * Validate if the grant has a valid reference to a community.
     */
    protected assertPayload(): boolean;
    static from(attestations: _Grant[]): Grant[];
}
export {};
