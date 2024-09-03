import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation, AttestationArgs } from "../Attestation";
import { GapSchema } from "../GapSchema";
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
    verified: ProjectMilestoneStatus[];
    constructor(data: AttestationArgs<IProjectMilestone, GapSchema>);
    /**
     * Attest the status of the update as approved, rejected or completed.
     */
    private attestMilestone;
    /**
     * Verify this ProjectUpdate. If the ProjectUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    verify(signer: SignerOrProvider, data?: IProjectMilestoneStatus, callback?: Function): Promise<void>;
    static from(attestations: _IProjectMilestone[], network: TNetwork): ProjectMilestone[];
}
export {};
