import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation, AttestationArgs } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Transaction } from "ethers";
import { IProjectMilestoneResponse } from "../karma-indexer/api/types";
import { MilestoneCompleted as ProjectMilestoneCompleted } from "../types/attestations";
export interface IProjectMilestone {
    title: string;
    text: string;
    type?: string;
}
type IStatus = "verified" | "completed";
export interface IProjectMilestoneStatus {
    type?: `project-milestone-${IStatus}`;
    proofOfWork?: string;
    reason?: string;
}
export declare class ProjectMilestoneStatus extends Attestation<IProjectMilestoneStatus> implements IProjectMilestoneStatus {
    type: `project-milestone-${IStatus}`;
    reason?: string;
}
export declare class ProjectMilestone extends Attestation<IProjectMilestone> implements IProjectMilestone {
    title: string;
    text: string;
    verified: ProjectMilestoneStatus[];
    completed: ProjectMilestoneCompleted;
    constructor(data: AttestationArgs<IProjectMilestone, GapSchema>);
    /**
     * Attest the status of the update as approved, rejected or completed.
     */
    private attestStatus;
    /**
     * Verify this ProjectUpdate. If the ProjectUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    verify(signer: SignerOrProvider, data?: IProjectMilestoneStatus, callback?: Function): Promise<void>;
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    complete(signer: SignerOrProvider, data?: IProjectMilestoneStatus, callback?: Function): Promise<{
        tx: Transaction[];
        uids: `0x${string}`[];
    }>;
    /**
     * Revokes the completed status of the milestone. If the milestone is not completed,
     * it will throw an error.
     * @param signer
     */
    revokeCompletion(signer: SignerOrProvider, callback?: Function): Promise<{
        tx: Transaction[];
        uids: `0x${string}`[];
    }>;
    static from(attestations: IProjectMilestoneResponse[], network: TNetwork): ProjectMilestone[];
}
export {};
