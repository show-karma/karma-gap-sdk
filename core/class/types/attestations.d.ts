import { Attestation, AttestationArgs } from "../Attestation";
import { Hex } from "core/types";
import { Project } from "../entities/Project";
import { GapSchema } from "../GapSchema";
import { GrantUpdate } from "../entities/GrantUpdate";
/** Attestation interfaces */
export type AttestationWithTxHash = {
    uids: Hex[] | Hex;
    txHash: Hex | string | string[];
};
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
    type?: string;
    externalId?: string;
}
export declare class CommunityDetails extends Attestation<ICommunityDetails> implements ICommunityDetails {
    name: string;
    description: string;
    imageURL: string;
    links: ExternalLink;
    slug?: string;
    type: string;
    externalId?: string;
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
    questions?: IGrantDetailsQuestion[];
    type?: string;
    startDate?: number;
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
    questions?: IGrantDetailsQuestion[];
    type: string;
    startDate?: number;
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
    type: "approved" | "rejected" | "completed" | "verified";
    reason?: string;
}
export declare class MilestoneCompleted extends Attestation<IMilestoneCompleted> implements IMilestoneCompleted {
    type: "approved" | "rejected" | "completed" | "verified";
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
    problem?: string;
    solution?: string;
    missionSummary?: string;
    locationOfImpact?: string;
    imageURL: string;
    links?: ExternalLink;
    tags?: ITag[];
    externalIds?: string[];
    slug?: string;
    type?: string;
    businessModel?: string;
    stageIn?: string;
    raisedMoney?: string;
    pathToTake?: string;
}
export declare class ProjectDetails extends Attestation<IProjectDetails> implements IProjectDetails {
    title: string;
    description: string;
    problem?: string;
    solution?: string;
    missionSummary?: string;
    locationOfImpact?: string;
    imageURL: string;
    links: ExternalLink;
    tags: ITag[];
    slug: string;
    type: string;
    externalIds: string[];
    businessModel?: string;
    stageIn?: string;
    raisedMoney?: string;
    pathToTake?: string;
}
export declare class Grantee {
    address: string;
    projects: Project[];
    constructor(address: Hex, projects?: Project[]);
}
export declare class GrantCompleted extends GrantUpdate {
}
export interface IGrantDetailsQuestion {
    query: string;
    explanation: string;
    type: string;
}
export interface IProjectEndorsement {
    comment?: string;
    type?: string;
}
export declare class ProjectEndorsement extends Attestation<IProjectEndorsement> implements IProjectEndorsement {
    comment?: string;
    type?: string;
    constructor(data: AttestationArgs<IProjectEndorsement, GapSchema>);
}
