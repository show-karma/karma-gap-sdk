import { TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
export interface _IProjectPointer extends ProjectPointer {
}
export interface IProjectPointer {
    ogProjectUID: string;
    type?: string;
}
export declare class ProjectPointer extends Attestation<IProjectPointer> implements IProjectPointer {
    ogProjectUID: string;
    static from(attestations: _IProjectPointer[], network: TNetwork): ProjectPointer[];
}
