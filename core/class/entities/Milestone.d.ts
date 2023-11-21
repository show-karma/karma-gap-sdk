import { SignerOrProvider } from '../../types';
import { Attestation } from '../Attestation';
import { MilestoneCompleted } from '../types/attestations';
interface _Milestone extends Milestone {
}
export interface IMilestone {
    title: string;
    endsAt: number;
    description: string;
}
export declare class Milestone extends Attestation<IMilestone> implements IMilestone {
    title: string;
    endsAt: number;
    description: string;
    completed: MilestoneCompleted;
    approved: MilestoneCompleted;
    rejected: MilestoneCompleted;
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
     * Attest the status of the milestone as approved, rejected or completed.
     */
    private attestStatus;
    static from(attestations: _Milestone[]): Milestone[];
}
export {};
