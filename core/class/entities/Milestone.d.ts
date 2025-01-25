import { Transaction } from "ethers";
import { MultiAttestPayload, SignerOrProvider, TNetwork } from "../../types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { IMilestoneResponse } from "../karma-indexer/api/types";
import { AttestationWithTx, IMilestoneCompleted, MilestoneCompleted } from "../types/attestations";
export interface IMilestone {
    title: string;
    startsAt?: number;
    endsAt: number;
    description: string;
    type?: string;
    priority?: number;
}
export declare class Milestone extends Attestation<IMilestone> implements IMilestone {
    title: string;
    startsAt?: number;
    endsAt: number;
    description: string;
    completed: MilestoneCompleted[];
    verified: MilestoneCompleted[];
    type: string;
    priority?: number;
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    complete(signer: SignerOrProvider, data?: IMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
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
}
