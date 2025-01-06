import { AxiosGQL } from "../../GraphQL/AxiosGQL";
import { Hex, IAttestationResponse, ICommunityResponse, ICommunityAdminsResponse, IGrantResponse, IProjectResponse, ISearchResponse, IProjectMilestoneResponse } from "./types";
export declare class GapIndexerApi extends AxiosGQL {
    constructor(url: string);
    attestation(uid: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<IAttestationResponse, any>>;
    attestations(schemaUID: string, search?: string, prune?: boolean): Promise<import("axios").AxiosResponse<IAttestationResponse[], any>>;
    attestationsOf(schemaUID: string, attester: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<IAttestationResponse[], any>>;
    /**
     * Community
     */
    communities(search?: string, prune?: boolean): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    communitiesOf(address: Hex, withGrants: boolean, prune?: boolean): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    adminOf(address: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    communityBySlug(slug: string, prune?: boolean): Promise<import("axios").AxiosResponse<ICommunityResponse, any>>;
    communityAdmins(uid: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<ICommunityAdminsResponse, any>>;
    /**
     * Project
     */
    projectBySlug(slug: string, prune?: boolean): Promise<import("axios").AxiosResponse<IProjectResponse, any>>;
    search(query: string, prune?: boolean): Promise<import("axios").AxiosResponse<ISearchResponse, any>>;
    searchProjects(query: string, prune?: boolean): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    projects(name?: string, prune?: boolean): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    projectsOf(grantee: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    projectMilestones(uidOrSlug: string, prune?: boolean): Promise<import("axios").AxiosResponse<IProjectMilestoneResponse[], any>>;
    /**
     * Grantee
     */
    grantee(address: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<any, any>>;
    grantees(prune?: boolean): Promise<import("axios").AxiosResponse<{
        [key: `0x${string}`]: {
            grants: number;
            projects: number;
        };
    }, any>>;
    /**
     * Grant
     */
    grantsOf(grantee: Hex, withCommunity?: boolean, prune?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantsFor(uid: string, withCommunity?: boolean, prune?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantsForExtProject(projectExtId: string, prune?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantBySlug(slug: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse, any>>;
    grantsByCommunity(uid: Hex, page?: number, pageLimit?: number, prune?: boolean): Promise<import("axios").AxiosResponse<{
        data: IGrantResponse[];
    }, any>>;
    /**
     * Milestone
     */
    milestonesOf(uid: Hex, prune?: boolean): Promise<import("axios").AxiosResponse<any, any>>;
    slugExists(slug: string, prune?: boolean): Promise<boolean>;
}
