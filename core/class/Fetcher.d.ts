import { Hex, IAttestation, TSchemaName } from 'core/types';
import { Attestation } from './Attestation';
import { Community, Grant, MemberOf, Milestone, Project } from './entities';
import { Grantee } from './types/attestations';
import { AxiosGQL } from './GraphQL/AxiosGQL';
export declare abstract class Fetcher extends AxiosGQL {
    /**
     * Fetch a single attestation by its UID.
     * @param uid
     */
    abstract attestation<T = unknown>(uid: Hex): Promise<Attestation<T>>;
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param search if set, will search decodedDataJson by the value.
     * @returns
     */
    abstract attestations(schemaName: TSchemaName, search?: string): Promise<IAttestation[]>;
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param recipient
     * @returns
     */
    abstract attestationsOf(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    /**
     * Fetch attestations of a schema for a specific recipient.
     * @param schemaName
     * @param recipient
     * @returns
     */
    abstract attestationsTo(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    /**
     * Fetch all available communities with details and grantees uids.
     *
     * If search is defined, will try to find communities by the search string.
     * @param search
     * @returns
     */
    abstract communities(search?: string): Promise<Community[]>;
    /**
     * Fetch a set of communities by their ids.
     * @param uids
     * @returns
     */
    abstract communitiesByIds(uids: Hex[]): Promise<Community[]>;
    /**
     * Fetch a community by its name with details, grants and milestones.
     *
     * It is possible that the resulted community is not the one you are looking for.
     * @param name
     * @returns
     */
    abstract communityBySlug(slug: string): Promise<Community>;
    /**
     * Fetch a community by its id. This method will also return the
     * community details and projects.
     */
    abstract communityById(uid: Hex): Promise<Community>;
    /**
     * Fetch a project by its id.
     * @param uid
     * @returns
     */
    abstract projectById(uid: Hex): Promise<Project>;
    /**
     * Fetch a project by its slug.
     * @param slug
     * @returns
     */
    abstract projectBySlug(slug: string): Promise<Project>;
    /**
     * Fetch projects with details and members.
     * @param name if set, will search by the name.
     * @returns
     */
    abstract projects(name?: string): Promise<Project[]>;
    /**
     * Fetch projects with details and members.
     * @param grantee the public address of the grantee
     * @returns
     */
    abstract projectsOf(grantee: Hex): Promise<Project[]>;
    /**
     * Fetch Grantee with details and projects.
     * @param address
     * @param withProjects if true, will get grantee project details.
     * @returns
     */
    abstract grantee(address: Hex): Promise<Grantee>;
    /**
     * Fetch all Grantees with details.
     * @returns
     */
    abstract grantees(): Promise<Grantee[]>;
    /**
     * Fetches the grantes related to a grantee address (recipient).
     * @param grantee grantee address
     * @returns
     */
    abstract grantsOf(grantee: Hex, withCommunity?: boolean): Promise<Grant[]>;
    /**
     * Fetch grants for an array of projects with milestones.
     * @param projects
     * @returns
     */
    abstract grantsFor(projects: Project[], withCommunity?: boolean): Promise<Grant[]>;
    /**
     * Fetch a grants that belongs to a community.
     * @param uid community uid
     * @returns
     */
    abstract grantsByCommunity(uid: Hex): any;
    /**
     * Fetch all milestones related to an array of Grants.
     * @param grants
     * @returns
     */
    abstract milestonesOf(grants: Grant[]): Promise<Milestone[]>;
    /**
     * Bulk fetch members with details of an array of Projects.
     * @param projects
     * @returns
     */
    abstract membersOf(projects: Project[]): Promise<MemberOf[]>;
    /**
     * Check if a name is already in use.
     * @param slug
     * @returns
     */
    abstract slugExists(slug: string): Promise<boolean>;
    /**
     * Get grants for a project by an external uid
     * > Works only for the indexed projects
     * @param projectExtId
     */
    abstract grantsForExtProject(projectExtId: string): Promise<Grant[]>;
}
