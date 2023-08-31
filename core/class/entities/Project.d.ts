import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { Grantee, MemberDetails, ProjectDetails, Tag } from "../types/attestations";
import { Hex, MultiAttestPayload } from "core/types";
import { Grant } from "./Grant";
import { MemberOf } from "./MemberOf";
export interface IProject {
    project: true;
}
export declare class Project extends Attestation<IProject> {
    details?: ProjectDetails;
    members: MemberOf[];
    grants: Grant[];
    grantee: Grantee;
    tags: Tag[];
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
    multiAttestPayload(currentPayload?: MultiAttestPayload, communityIdx?: number): MultiAttestPayload;
    attest(signer: SignerOrProvider): Promise<void>;
    /**
     * Add new members to the project.
     * If any member in the array already exists in the project
     * it'll be ignored.
     *
     * __To modify member details, use `addMemberDetails(signer, MemberDetails[])` instead.__
     * @param signer
     * @param members
     */
    addMembers(signer: SignerOrProvider, members: MemberDetails[]): Promise<void>;
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
}