import { SignerOrProvider, TNetwork } from "../../types";
import { Attestation, AttestationArgs } from "../Attestation";
import { GapSchema } from "../GapSchema";
export interface _IProjectImpact extends ProjectImpact {
}
type IStatus = "verified";
export interface IProjectImpactStatus {
    type?: `project-impact-${IStatus}`;
    reason?: string;
}
export declare class ProjectImpactStatus extends Attestation<IProjectImpactStatus> implements IProjectImpactStatus {
    type: `project-impact-${IStatus}`;
    reason?: string;
}
export interface IProjectImpact {
    work: string;
    impact: string;
    proof: string;
    startedAt?: number;
    completedAt: number;
    type?: string;
    verified: ProjectImpactStatus[];
}
export declare class ProjectImpact extends Attestation<IProjectImpact> implements IProjectImpact {
    work: string;
    impact: string;
    proof: string;
    startedAt?: number;
    completedAt: number;
    type?: string;
    verified: ProjectImpactStatus[];
    constructor(data: AttestationArgs<IProjectImpact, GapSchema>);
    /**
     * Attest Project Impact.
     */
    private attestStatus;
    /**
     * Verify this ProjectImpact. If the ProjectImpact is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    verify(signer: SignerOrProvider, data?: IProjectImpactStatus, callback?: Function): Promise<void>;
    static from(attestations: ProjectImpact[], network: TNetwork): ProjectImpact[];
}
export {};
