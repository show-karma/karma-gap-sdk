import { Attestation } from "../Attestation";
import { Hex, TExternalLink } from "core/types";
import { Project } from "../entities/Project";
/** Attestation interfaces */
export interface IExternalLink {
    url: string;
    type: TExternalLink;
}
export declare class ExternalLink extends Attestation<IExternalLink> implements IExternalLink {
    url: string;
    type: TExternalLink;
}
export interface ICommunityDetails {
    name: string;
    description: string;
    imageURL: string;
}
export declare class CommunityDetails extends Attestation<ICommunityDetails> implements ICommunityDetails {
    name: string;
    description: string;
    imageURL: string;
    links: ExternalLink[];
}
export interface IGrantDetails {
    title: string;
    amount: string;
    proposalURL: string;
    assetAndChainId?: [Hex, number];
    payoutAddress: Hex;
    description?: string;
}
export declare class GrantDetails extends Attestation<IGrantDetails> implements IGrantDetails {
    title: string;
    amount: string;
    proposalURL: string;
    assetAndChainId?: [Hex, number];
    description?: string;
    payoutAddress: Hex;
}
export interface IGrantRound {
    name: string;
}
export declare class GrantRound extends Attestation<IGrantRound> implements IGrantRound {
    name: string;
}
export interface IGrantVerified {
    verified: boolean;
}
export declare class GrantVerified extends Attestation<IGrantVerified> implements IGrantVerified {
    verified: boolean;
}
export interface IMemberDetails {
    name: string;
    profilePictureURL: string;
}
export declare class MemberDetails extends Attestation<IMemberDetails> implements IMemberDetails {
    name: string;
    profilePictureURL: string;
}
export interface IMemberOf {
    memberOf: true;
}
export declare class MemberOf extends Attestation<IMemberOf> {
    details?: MemberDetails;
}
export interface IMilestoneCompleted {
    completed: boolean;
}
export declare class MilestoneCompleted extends Attestation<IMilestoneCompleted> {
}
export interface IMilestoneApproved {
    approved: boolean;
}
export declare class MilestoneApproved extends Attestation<IMilestoneApproved> {
}
export interface ITag {
    name: string;
}
export declare class Tag extends Attestation<ITag> implements ITag {
    name: string;
}
export interface IProjectDetails {
    title: string;
    description: string;
    imageURL: string;
}
export declare class ProjectDetails extends Attestation<IProjectDetails> implements IProjectDetails {
    title: string;
    description: string;
    imageURL: string;
    links: ExternalLink[];
}
export declare class Grantee {
    address: string;
    projects: Project[];
    constructor(address: Hex, projects?: Project[]);
}
