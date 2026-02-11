import { IGrantUpdateBase } from "core/shared/types";
export type Hex = `0x${string}`;
export type JSONStr = string;
export type ExternalLink = {
    type: string;
    url: string;
};
export type ExternalCustomLink = {
    type: 'custom';
    url: string;
    name: string;
};
export interface ITag {
    name: string;
}
export interface IAttestationResponse {
    id: string;
    uid: Hex;
    schemaUID: Hex;
    refUID: Hex;
    attester: Hex;
    recipient: Hex;
    revoked: boolean;
    revocationTime?: number;
    createdAt: any;
    updatedAt: any;
    chainID: number;
    type: string;
    data: any;
    decodedDataJson: JSONStr;
    isOffchain: any;
    revocable: any;
    schemaId: Hex;
}
export interface ISummaryProject {
    title: string;
    slug?: string;
    uid: Hex;
}
export interface IMilestoneCompleted extends IAttestationResponse {
    type: "MilestoneStatus";
    data: {
        type: "approved" | "rejected" | "completed";
        reason?: string;
        proofOfWork?: string;
    };
}
export interface IMilestoneResponse extends IAttestationResponse {
    type: "Milestone";
    completed?: IMilestoneCompleted;
    approved?: IMilestoneCompleted;
    rejected?: IMilestoneCompleted;
    verified?: IMilestoneCompleted[];
    data: {
        title: string;
        description: string;
        endsAt: number;
        startsAt?: number;
        type: "milestone";
        priority?: number;
    };
}
export interface IGrantUpdateStatus extends IAttestationResponse {
    type: `grant-update-${IStatus}`;
    reason?: string;
    data: {
        type: "approved" | "rejected" | "completed";
        reason?: string;
        pitchDeck?: string;
        demoVideo?: string;
        trackExplanations?: Array<{
            trackId: string;
            trackName: string;
            explanation: string;
        }>;
    };
}
export interface IGrantUpdate extends IAttestationResponse {
    data: IGrantUpdateBase & {
        type: "grant-update";
    };
    verified?: IGrantUpdateStatus[];
}
export interface IProjectUpdateStatus extends IAttestationResponse {
    type: `project-update-${IStatus}`;
    reason?: string;
    data: {
        type: "approved" | "rejected" | "completed";
        reason?: string;
    };
}
export interface IProjectUpdate extends IAttestationResponse {
    data: {
        title: string;
        text: string;
        startDate?: Date;
        endDate?: Date;
        grants?: string[];
        indicators?: {
            name: string;
            indicatorId: string;
        }[];
        deliverables?: {
            name: string;
            proof: string;
            description: string;
        }[];
        type: "project-update";
    };
    verified?: IProjectUpdateStatus[];
}
export interface IProjectMilestoneStatus extends IAttestationResponse {
    type: `project-milestone-verified`;
    reason?: string;
    data: {
        type: "approved" | "rejected" | "completed";
        reason?: string;
    };
}
export interface IProjectMilestoneResponse extends IAttestationResponse {
    data: {
        text: string;
        title: string;
        type: "project-milestone";
    };
    verified?: IProjectMilestoneStatus[];
    completed?: IMilestoneCompleted;
}
export interface IProjectPointer extends IAttestationResponse {
    data: {
        ogProjectUID: string;
        type: "project-pointer";
    };
}
export interface IGrantDetails extends IAttestationResponse {
    type: "GrantDetails";
    data: {
        title: string;
        amount: string;
        description: string;
        proposalURL: string;
        assetAndChainId?: [Hex, number];
        payoutAddress: Hex;
        questions: {
            type: string;
            query: string;
            explanation: string;
        }[];
        startDate?: number;
        receivedDate?: number;
        programId?: string;
        type: "grant-details";
        fundUsage?: string;
        selectedTrackIds?: string[];
    };
}
export interface IGrantResponse extends IAttestationResponse {
    type: "Grant";
    data: {
        communityUID: Hex;
    };
    details?: IGrantDetails;
    milestones: IMilestoneResponse[];
    completed?: IGrantUpdate;
    project: IProjectResponse;
    updates: IGrantUpdate[];
    community: ICommunityResponse;
    members: Hex[];
    categories?: string[];
    externalAddresses?: {
        [key: string]: string;
    };
    external?: {
        [key: string]: string[];
    };
    amount?: Hex;
}
export interface IMemberDetails extends IAttestationResponse {
    name: string;
    profilePictureURL: string;
}
export interface IMemberOf extends IAttestationResponse {
    type: "MemberOf";
    data: {
        memberOf: true;
    };
    details?: IMemberDetails;
}
export interface IProjectDetails extends IAttestationResponse {
    type: "ProjectDetails";
    data: {
        title: string;
        description: string;
        problem?: string;
        solution?: string;
        missionSummary?: string;
        locationOfImpact?: string;
        imageURL: string;
        links?: Array<ExternalLink | ExternalCustomLink>;
        tags?: ITag[];
        slug?: string;
        type: "project-details";
        businessModel?: string;
        stageIn?: string;
        raisedMoney?: string;
        pathToTake?: string;
    };
}
type IStatus = "verified";
export interface IProjectImpactStatus extends IAttestationResponse {
    type: `project-impact-${IStatus}`;
    reason?: string;
}
export interface IProjectImpact extends IAttestationResponse {
    type: "ProjectImpact";
    data: {
        work: string;
        impact: string;
        proof: string;
        startedAt?: number;
        completedAt: number;
        type: "project-impact";
    };
    verified: IProjectImpactStatus[];
}
export interface IProjectEndorsement extends IAttestationResponse {
    type: "ProjectEndorsement";
    data: {
        comment?: string;
        type?: "project-endorsement";
    };
}
export interface IProjectResponse extends IAttestationResponse {
    type: "Project";
    data: {
        project: true;
    };
    details?: IProjectDetails;
    members: IMemberOf[];
    grants: IGrantResponse[];
    grantee: any;
    impacts: IProjectImpact[];
    updates: IProjectUpdate[];
    pointers: IProjectPointer[];
    symlinks: Hex[];
    endorsements: IProjectEndorsement[];
    milestones: IProjectMilestoneResponse[];
    payoutAddress?: Hex;
}
export interface ICommunityDetails extends IAttestationResponse {
    type: "CommunityDetails";
    data: {
        name: string;
        description: string;
        imageURL: string;
        links: ExternalLink[];
        slug?: string;
    };
}
export interface ICommunityResponse extends IAttestationResponse {
    type: "Community";
    data: {
        community: true;
    };
    details?: ICommunityDetails;
    grants: IGrantResponse[];
}
export interface ICommunityAdminsResponse {
    id: string;
    admins: {
        user: {
            id: string;
        };
    }[];
}
export interface ISearchResponse {
    projects: IProjectResponse[];
    communities: ICommunityResponse[];
}
export interface ITrackResponse {
    id: string;
    name: string;
    description?: string;
    communityUID: string;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    programId?: string;
    isActive?: boolean;
    chainID?: number;
}
export interface ITrackAssignmentResponse {
    id: string;
    programId: string;
    chainID: number;
    trackId: string;
    track: ITrackResponse;
}
export interface IProjectTrackResponse {
    projectUID: string;
    chainID: number;
    programId: string;
    track: ITrackResponse;
    project: {
        uid: string;
        chainID: number;
        details: any;
    };
}
export {};
