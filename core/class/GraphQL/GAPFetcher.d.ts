import { Attestation } from "../Attestation";
import { Hex, IAttestation, TSchemaName } from "../../types";
import { Grantee } from "../types/attestations";
import { GapSchema } from "../GapSchema";
import { EASClient } from "./EASClient";
import { Grant, Milestone, Project, MemberOf } from "../entities";
import { Community } from "../entities/Community";
export declare class GAPFetcher extends EASClient {
    /**
     * Fetches all the schemas deployed by an owner
     * @param owner
     */
    schemas(owner: Hex): Promise<GapSchema[]>;
    /**
     * Fetch a single attestation by its UID.
     * @param uid
     */
    attestation<T = unknown>(uid: Hex): Promise<Attestation<T, GapSchema>>;
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param search if set, will search decodedDataJson by the value.
     * @returns
     */
    attestations(schemaName: TSchemaName, search?: string): Promise<IAttestation[]>;
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param recipient
     * @returns
     */
    attestationsOf(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    /**
     * Fetch attestations of a schema for a specific recipient.
     * @param schemaName
     * @param recipient
     * @returns
     */
    attestationsTo(schemaName: TSchemaName, recipient: Hex): Promise<IAttestation[]>;
    /**
     * Fetch all dependent attestations of a parent schema.
     * @param parentSchema the schema name to get dependents of.
     * @param parentUid the parent uid to get dependents of.
     */
    dependentsOf(parentSchema: TSchemaName, parentUid: Hex): Promise<Attestation[]>;
    /**
     * Fetch all available communities with details and grantees uids.
     *
     * If search is defined, will try to find communities by the search string.
     * @param search
     * @returns
     */
    communities(search?: string): Promise<Community[]>;
    /**
     * Fetch a community by its id. This method will also return the
     * community details and projects.
     */
    communityById(uid: Hex): Promise<Community>;
    /**
     * Fetch the details for a set of
     * projects with project grants,
     * members, milestones, and tags.
     * @param projects
     */
    projectsDetails(projects: Project[]): Promise<Project[]>;
    /**
     * Fetch a project by its id.
     * @param uid
     * @returns
     */
    projectById(uid: Hex): Promise<Project>;
    /**
     * Fetch projects with details and members.
     * @param name if set, will search by the name.
     * @returns
     */
    projects(name?: string): Promise<Project[]>;
    /**
     * Fetch projects with details and members.
     * @param grantee the public address of the grantee
     * @returns
     */
    projectsOf(grantee: Hex): Promise<Project[]>;
    /**
     * Fetch Grantee with details and projects.
     * @param address
     * @param withProjects if true, will get grantee project details.
     * @returns
     */
    grantee(address: Hex): Promise<Grantee>;
    /**
     * Fetch all Grantees with details.
     * @returns
     */
    grantees(): Promise<Grantee[]>;
    /**
     * Fetches the grantes related to a grantee address (recipient).
     * @param grantee
     * @returns
     */
    grantsOf(grantee: Hex): Promise<Grant[]>;
    /**
     * Fetch grants for an array of projects with milestones.
     * @param projects
     * @returns
     */
    grantsFor(projects: Project[]): Promise<Grant[]>;
    /**
     * Fetch projects by related tag names.
     * @param names
     * @returns
     */
    projectsByTags(names: string[]): Promise<Project[]>;
    /**
     * Fetch all milestones related to an array of Grants.
     * @param grants
     * @returns
     */
    milestonesOf(grants: Grant[]): Promise<Milestone[]>;
    /**
     * Bulk fetch members with details of an array of Projects.
     * @param projects
     * @returns
     */
    membersOf(projects: Project[]): Promise<MemberOf[]>;
}
