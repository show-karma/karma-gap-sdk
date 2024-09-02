import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
export interface _IProjectUpdate extends ProjectUpdate {
}
export interface IProjectUpdate {
    title: string;
    text: string;
    type?: string;
}
type IStatus = "verified";
export interface IProjectUpdateStatus {
    type?: `project-update-${IStatus}`;
    reason?: string;
}
export declare class ProjectUpdateStatus extends Attestation<IProjectUpdateStatus> implements IProjectUpdateStatus {
    type: `project-update-${IStatus}`;
    reason?: string;
}
export declare class ProjectUpdate extends Attestation<IProjectUpdate> implements IProjectUpdate {
    title: string;
    text: string;
    verified: ProjectUpdateStatus[];
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
    verify(signer: SignerOrProvider, data?: IProjectUpdateStatus, callback?: Function): Promise<void>;
    static from(attestations: _IProjectUpdate[], network: TNetwork): ProjectUpdate[];
}
export {};
