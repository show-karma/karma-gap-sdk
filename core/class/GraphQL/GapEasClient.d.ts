import { Attestation } from "../Attestation";
import { EASNetworkConfig, Hex, IAttestation, TNetwork, TSchemaName } from "../../types";
import { Grantee } from "../types/attestations";
import { GapSchema } from "../GapSchema";
import { Grant, Milestone, Project, MemberOf } from "../entities";
import { Community } from "../entities/Community";
import { Fetcher } from "./Fetcher";
interface EASClientProps {
    network: TNetwork;
}
export declare class GapEasClient extends Fetcher {
    network: EASNetworkConfig & {
        name: TNetwork;
    };
    constructor(args: EASClientProps);
    /**
     * Fetches all the schemas deployed by an owner
     * @param owner
     */
    schemas(owner: Hex): Promise<GapSchema[]>;
    attestation<T = unknown>(uid: Hex): Promise<Attestation<T, GapSchema>>;
    attestations(schemaName: TSchemaName, search?: string): Promise<IAttestation[]>;
    attestationsOf(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    attestationsTo(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    /**
     * Fetch all dependent attestations of a parent schema.
     * @param parentSchema the schema name to get dependents of.
     * @param parentUid the parent uid to get dependents of.
     */
    dependentsOf(parentSchema: TSchemaName, parentUid: Hex): Promise<Attestation[]>;
    communities(search?: string): Promise<Community[]>;
    communitiesByIds(uids: Hex[]): Promise<Community[]>;
    communitiesDetails(communities: Community[]): Promise<Community[]>;
    communityBySlug(slug: string): Promise<Community>;
    communityById(uid: Hex): Promise<Community>;
    /**
     * Fetch the details for a set of
     * projects with project grants,
     * members, milestones, and tags.
     * @param projects
     */
    projectsDetails(projects: Project[]): Promise<Project[]>;
    projectById(uid: Hex): Promise<Project>;
    projectBySlug(slug: string): Promise<Project>;
    slugExists(slug: string): Promise<boolean>;
    projects(name?: string): Promise<Project[]>;
    projectsOf(grantee: Hex): Promise<Project[]>;
    grantee(address: Hex): Promise<Grantee>;
    grantees(): Promise<Grantee[]>;
    grantsOf(grantee: Hex, withCommunity?: boolean): Promise<Grant[]>;
    grantsUpdates(grants: Grant[]): Promise<Grant[]>;
    grantsByCommunity(uid: Hex): Promise<Grant[]>;
    grantsFor(projects: Project[], withCommunity?: boolean): Promise<Grant[]>;
    milestonesOf(grants: Grant[]): Promise<Milestone[]>;
    membersOf(projects: Project[]): Promise<MemberOf[]>;
    /**
     * Returns a string to be used to search by a value in `decodedDataJson`.
     * @param field
     * @param value
     */
    private getSearchFieldString;
}
export {};
