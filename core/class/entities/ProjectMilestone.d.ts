import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { AttestationWithTx, IProjectMilestoneCompleted, ProjectMilestoneCompleted } from "../types/attestations";
export interface _IProjectMilestone extends ProjectMilestone {
}
export interface IProjectMilestone {
    title: string;
    text: string;
    type?: string;
}
type IStatus = "verified";
export interface IProjectMilestoneStatus {
    type?: `project-milestone-${IStatus}`;
    reason?: string;
}
export declare class ProjectMilestoneStatus extends Attestation<IProjectMilestoneStatus> implements IProjectMilestoneStatus {
    type: `project-milestone-${IStatus}`;
    reason?: string;
}
export declare class ProjectMilestone extends Attestation<IProjectMilestone> implements IProjectMilestone {
    title: string;
    text: string;
    completed: ProjectMilestoneCompleted;
    /**
     * Attest the status of the milestone as completed.
     */
    private attestStatus;
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    complete(signer: SignerOrProvider, data?: IProjectMilestoneCompleted, callback?: Function): Promise<AttestationWithTx>;
    static from(attestations: _IProjectMilestone[], network: TNetwork): ProjectMilestone[];
}
export {};
