export type Hex = `0x${string}`;
export type JSONStr = string;
export type ExternalLink = {
    type: string;
    url: string;
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
    };
}
export interface IGrantUpdateStatus extends IAttestationResponse {
    type: `grant-update-${IStatus}`;
    reason?: string;
    data: {
        type: "approved" | "rejected" | "completed";
        reason?: string;
    };
}
export interface IGrantUpdate extends IAttestationResponse {
    data: {
        text: string;
        title: string;
        type: "grant-update";
    };
    verified?: IGrantUpdateStatus[];
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
        startDate: number;
        type: "grant-details";
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
    project: ISummaryProject;
    updates: IGrantUpdate[];
    community: ICommunityResponse;
    members: Hex[];
    categories?: string[];
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
        links?: ExternalLink[];
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
    endorsements: IProjectEndorsement[];
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
export {};
