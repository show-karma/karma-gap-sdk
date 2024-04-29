import { MultiAttestPayload, SignerOrProvider, TNetwork } from '../../types';
import { Attestation } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { IMilestoneResponse } from '../karma-indexer/api/types';
import { MilestoneCompleted } from '../types/attestations';
export interface IMilestone {
    title: string;
    startsAt?: number;
    endsAt: number;
    description: string;
    type?: string;
}
export declare class Milestone extends Attestation<IMilestone> implements IMilestone {
    title: string;
    startsAt?: number;
    endsAt: number;
    description: string;
    completed: MilestoneCompleted;
    approved: MilestoneCompleted;
    rejected: MilestoneCompleted;
    verified: MilestoneCompleted[];
    type: string;
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    approve(signer: SignerOrProvider, reason?: string): Promise<void>;
    /**
     * Revokes the approved status of the milestone. If the milestone is not approved,
     * it will throw an error.
     * @param signer
     */
    revokeApproval(signer: SignerOrProvider): Promise<void>;
    /**
     * Reject a completed milestone. If the milestone is not completed or already rejected,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    reject(signer: SignerOrProvider, reason?: string): Promise<void>;
    /**
     * Revokes the rejected status of the milestone. If the milestone is not rejected,
     * it will throw an error.
     * @param signer
     */
    revokeRejection(signer: SignerOrProvider): Promise<void>;
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    complete(signer: SignerOrProvider, reason?: string): Promise<void>;
    /**
     * Revokes the completed status of the milestone. If the milestone is not completed,
     * it will throw an error.
     * @param signer
     */
    revokeCompletion(signer: SignerOrProvider): Promise<void>;
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param grantIdx
     */
    multiAttestPayload(currentPayload?: MultiAttestPayload, grantIdx?: number): Promise<[Attestation<unknown, GapSchema>, import("../../types").RawMultiAttestPayload][]>;
    /**
     * @inheritdoc
     */
    attest(signer: SignerOrProvider): Promise<void>;
    /**
     * Attest the status of the milestone as approved, rejected or completed.
     */
    private attestStatus;
    static from(attestations: IMilestoneResponse[], network: TNetwork): Milestone[];
    /**
   * Verify this milestone. If the milestone is not completed or already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
    verify(signer: SignerOrProvider, reason?: string): Promise<void>;
}
