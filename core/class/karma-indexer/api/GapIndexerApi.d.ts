import { AxiosGQL } from "../../GraphQL/AxiosGQL";
import { Hex, IAttestationResponse, ICommunityResponse, IGrantResponse, IProjectResponse } from "./types";
export declare class GapIndexerApi extends AxiosGQL {
    constructor(url: string);
    attestation(uid: Hex): Promise<import("axios").AxiosResponse<IAttestationResponse, any>>;
    attestations(schemaUID: string, search?: string): Promise<import("axios").AxiosResponse<IAttestationResponse[], any>>;
    attestationsOf(schemaUID: string, attester: Hex): Promise<import("axios").AxiosResponse<IAttestationResponse[], any>>;
    /**
     * Community
     */
    communities(search?: string): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    communitiesOf(address: Hex, withGrants: boolean): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    adminOf(address: Hex): Promise<import("axios").AxiosResponse<ICommunityResponse[], any>>;
    communityBySlug(slug: string): Promise<import("axios").AxiosResponse<ICommunityResponse, any>>;
    /**
     * Project
     */
    projectBySlug(slug: string): Promise<import("axios").AxiosResponse<IProjectResponse, any>>;
    searchProjects(query: string): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    projects(name?: string): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    projectsOf(grantee: Hex): Promise<import("axios").AxiosResponse<IProjectResponse[], any>>;
    /**
     * Grantee
     */
    grantee(address: Hex): Promise<import("axios").AxiosResponse<any, any>>;
    grantees(): Promise<import("axios").AxiosResponse<{
        [key: `0x${string}`]: {
            grants: number;
            projects: number;
        };
    }, any>>;
    /**
     * Grant
     */
    grantsOf(grantee: Hex, withCommunity?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantsFor(uid: string, withCommunity?: boolean): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantsForExtProject(projectExtId: string): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    grantsByCommunity(uid: Hex): Promise<import("axios").AxiosResponse<IGrantResponse[], any>>;
    /**
     * Milestone
     */
    milestonesOf(uid: Hex): Promise<import("axios").AxiosResponse<any, any>>;
    slugExists(slug: string): Promise<boolean>;
}
