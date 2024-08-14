import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
export interface _IGrantUpdate extends GrantUpdate {
}
export interface IGrantUpdate {
    title: string;
    text: string;
    type?: string;
}
type IStatus = "verified";
export interface IGrantUpdateStatus {
    type: `grant-update-${IStatus}`;
    reason?: string;
    linkToProof?: string;
}
export declare class GrantUpdateStatus extends Attestation<IGrantUpdateStatus> implements IGrantUpdateStatus {
    type: `grant-update-${IStatus}`;
    reason?: string;
    linkToProof?: string;
}
export declare class GrantUpdate extends Attestation<IGrantUpdate> implements IGrantUpdate {
    title: string;
    text: string;
    verified: GrantUpdateStatus[];
    /**
     * Attest the status of the milestone as approved, rejected or completed.
     */
    private attestStatus;
    /**
     * Verify this GrantUpdate. If the GrantUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    verify(signer: SignerOrProvider, data?: GrantUpdateStatus, callback?: Function): Promise<void>;
    static from(attestations: _IGrantUpdate[], network: TNetwork): GrantUpdate[];
}
export {};
