import { Attestation } from "../Attestation";
import { AttestationWithTx, Grantee, MemberDetails, ProjectDetails, ProjectEndorsement } from "../types/attestations";
import { Hex, MultiAttestPayload, SignerOrProvider, TNetwork } from "core/types";
import { Grant } from "./Grant";
import { MemberOf } from "./MemberOf";
import { IProjectResponse } from "../karma-indexer/api/types";
import { ProjectImpact } from "./ProjectImpact";
import { ProjectUpdate } from "./ProjectUpdate";
import { ProjectPointer } from "./ProjectPointer";
export interface IProject {
    project: true;
}
export declare class Project extends Attestation<IProject> {
    details?: ProjectDetails;
    members: MemberOf[];
    grants: Grant[];
    grantee: Grantee;
    impacts: ProjectImpact[];
    endorsements: ProjectEndorsement[];
    updates: ProjectUpdate[];
    pointers: ProjectPointer[];
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param communityIdx
     */
    multiAttestPayload(currentPayload?: MultiAttestPayload, communityIdx?: number): Promise<MultiAttestPayload>;
    attest(signer: SignerOrProvider, callback?: Function): Promise<AttestationWithTx>;
    transferOwnership(signer: SignerOrProvider, newOwner: Hex, callback?: Function): Promise<void>;
    isOwner(signer: SignerOrProvider): Promise<boolean>;
    /**
     * Add new members to the project.
     * If any member in the array already exists in the project
     * it'll be ignored.
     * @param members
     */
    pushMembers(...members: Hex[]): void;
    /**
     * Add new members to the project.
     * If any member in the array already exists in the project
     * it'll be ignored.
     *
     * __To modify member details, use `addMemberDetails(signer, MemberDetails[])` instead.__
     * @param signer
     * @param members
     */
    attestMembers(signer: SignerOrProvider, members: MemberDetails[], callback?: Function): Promise<void>;
    /**
     * Add new details to the members of a project. Note that it will overwrite
     * any existing details.
     *
     * @param signer
     * @param entities
     */
    private addMemberDetails;
    /**
     * Clean member details.
     * @param signer
     * @param uids
     */
    cleanDetails(signer: SignerOrProvider, uids: Hex[]): Promise<void>;
    /**
     * Remove members from the project.
     * @param signer
     * @param uids
     * @returns
     */
    removeMembers(signer: SignerOrProvider, uids: Hex[]): Promise<void>;
    /**
     * Remove all members from the project.
     * @param signer
     */
    removeAllMembers(signer: SignerOrProvider): Promise<void>;
    static from(attestations: IProjectResponse[], network: TNetwork): Project[];
    attestUpdate(signer: SignerOrProvider, data: ProjectUpdate, callback?: Function): Promise<void>;
    attestPointer(signer: SignerOrProvider, data: ProjectPointer, callback?: Function): Promise<void>;
    attestImpact(signer: SignerOrProvider, data: ProjectImpact): Promise<void>;
    attestEndorsement(signer: SignerOrProvider, data?: ProjectEndorsement): Promise<void>;
}
