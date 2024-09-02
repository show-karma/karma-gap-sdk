import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
export interface _IProjectObjective extends ProjectObjective {
}
export interface IProjectObjective {
    title: string;
    text: string;
    type?: string;
}
type IStatus = "verified";
export interface IProjectObjectiveStatus {
    type?: `project-objective-${IStatus}`;
    reason?: string;
}
export declare class ProjectObjectiveStatus extends Attestation<IProjectObjectiveStatus> implements IProjectObjectiveStatus {
    type: `project-objective-${IStatus}`;
    reason?: string;
}
export declare class ProjectObjective extends Attestation<IProjectObjective> implements IProjectObjective {
    title: string;
    text: string;
    verified: ProjectObjectiveStatus[];
    /**
     * Attest the status of the update as approved, rejected or completed.
     */
    private attestObjective;
    /**
     * Verify this ProjectUpdate. If the ProjectUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    verify(signer: SignerOrProvider, data?: IProjectObjectiveStatus, callback?: Function): Promise<void>;
    static from(attestations: _IProjectObjective[], network: TNetwork): ProjectObjective[];
}
export {};
