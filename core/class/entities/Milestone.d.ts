import { Transaction } from "../../utils/unified-types";
import { Hex, MultiAttestPayload, MultiRevokeArgs, SignerOrProvider, TNetwork } from "../../types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { IMilestoneResponse } from "../karma-indexer/api/types";
import { AttestationWithTx, MilestoneCompleted, IMilestoneCompleted } from "../types/attestations";
export interface IMilestone {
    title: string;
    startsAt?: number;
    endsAt: number;
    description: string;
    type?: string;
    priority?: number;
}
/**
 * Milestone class represents a milestone that can be attested to one or multiple grants.
 *
 * It provides methods to:
 * - Create, complete, approve, reject, and verify milestones
 * - Attest a milestone to a single grant
 * - Attest a milestone to multiple grants in a single transaction
 * - Complete, approve, and verify milestones across multiple grants
 * - Revoke multiple milestone attestations at once
 */
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
    priority?: number;
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    approve(signer: SignerOrProvider, data?: IMilestoneCompleted, callback?: Function): Promise<void>;
    /**
     * Approves this milestone across multiple grants. If the milestones are not completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param milestoneUIDs - Array of milestone UIDs to approve
     * @param data - Optional approval data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    approveMultipleGrants(signer: SignerOrProvider, milestoneUIDs: Hex[], data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
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
    revokeRejection(signer: SignerOrProvider): Promise<{
        tx: Transaction[];
        uids: `0x${string}`[];
    }>;
    /**
     * Revokes multiple milestone attestations at once.
     * This method can be used to revoke multiple milestone attestations in a single transaction.
     *
     * @param signer - The signer to use for revocation
     * @param attestationsToRevoke - Array of objects containing schemaId and uid of attestations to revoke
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs of revoked attestations
     */
    revokeMultipleAttestations(signer: SignerOrProvider, attestationsToRevoke: MultiRevokeArgs[], callback?: Function): Promise<AttestationWithTx>;
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    complete(signer: SignerOrProvider, data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
    /**
     * Marks a milestone as completed across multiple grants. If the milestone is already completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param grantIndices - Array of grant indices to attest this milestone to, or array of milestone UIDs
     * @param data - Optional completion data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    completeForMultipleGrants(signer: SignerOrProvider, grantIndicesOrMilestoneUIDs?: number[] | Hex[], data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
    /**
     * Revokes the completed status of the milestone. If the milestone is not completed,
     * it will throw an error.
     * @param signer
     */
    revokeCompletion(signer: SignerOrProvider, callback?: Function): Promise<{
        tx: Transaction[];
        uids: `0x${string}`[];
    }>;
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
     * Creates the payload for a multi-attestation across multiple grants.
     *
     * This method allows for the same milestone to be attested to multiple grants
     * in a single transaction.
     *
     * @param currentPayload - Current payload to append to
     * @param grantIndices - Array of grant indices to attest this milestone to
     * @returns The multi-attest payload with all grant attestations
     */
    multiGrantAttestPayload(currentPayload?: MultiAttestPayload, grantIndices?: number[]): Promise<[Attestation<unknown, GapSchema>, import("../../types").RawMultiAttestPayload][]>;
    /**
     * Attests this milestone to multiple grants in a single transaction.
     *
     * @param signer - The signer to use for attestation
     * @param grantIndices - Array of grant indices to attest this milestone to, or array of grant UIDs
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    attestToMultipleGrants(signer: SignerOrProvider, grantIndices?: number[] | Hex[], callback?: Function): Promise<AttestationWithTx>;
    /**
     * @inheritdoc
     */
    attest(signer: SignerOrProvider, callback?: Function): Promise<AttestationWithTx>;
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
    verify(signer: SignerOrProvider, data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
    /**
     * Verifies this milestone across multiple grants. If the milestones are not completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param milestoneUIDs - Array of milestone UIDs to verify
     * @param data - Optional verification data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    verifyMultipleGrants(signer: SignerOrProvider, milestoneUIDs: Hex[], data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
}
