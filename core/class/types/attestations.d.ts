import { Attestation } from "../Attestation";
import { Hex } from "core/types";
import { Project } from "../entities/Project";
/** Attestation interfaces */
export type ExternalLink = {
    type: string;
    url: string;
}[];
export interface ICommunityDetails {
    name: string;
    description: string;
    imageURL: string;
    slug?: string;
    links?: ExternalLink;
}
export declare class CommunityDetails extends Attestation<ICommunityDetails> implements ICommunityDetails {
    name: string;
    description: string;
    imageURL: string;
    links: ExternalLink;
    slug?: string;
}
export interface IGrantDetails {
    title: string;
    amount?: string;
    proposalURL: string;
    assetAndChainId?: [Hex, number];
    payoutAddress?: Hex;
    description?: string;
    season?: string;
    cycle?: string;
}
export declare class GrantDetails extends Attestation<IGrantDetails> implements IGrantDetails {
    title: string;
    proposalURL: string;
    payoutAddress?: Hex;
    amount?: string;
    assetAndChainId?: [Hex, number];
    description?: string;
    season?: string;
    cycle?: string;
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
export interface IMilestoneCompleted {
    type: "approved" | "rejected" | "completed";
    reason?: string;
}
export declare class MilestoneCompleted extends Attestation<IMilestoneCompleted> implements IMilestoneCompleted {
    type: "approved" | "rejected" | "completed";
    reason?: string;
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
    links?: ExternalLink;
    tags?: ITag[];
    slug?: string;
}
export declare class ProjectDetails extends Attestation<IProjectDetails> implements IProjectDetails {
    title: string;
    description: string;
    imageURL: string;
    links: ExternalLink;
    tags?: ITag[];
    slug: string;
}
export declare class Grantee {
    address: string;
    projects: Project[];
    constructor(address: Hex, projects?: Project[]);
}
export interface IGrantUpdate {
    title: string;
    text: string;
    type?: string;
}
export declare class GrantUpdate extends Attestation<IGrantUpdate> implements IGrantUpdate {
    title: string;
    text: string;
}
