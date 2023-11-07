import { TSchemaName, IAttestation } from 'core/types';
import { Attestation } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { Fetcher } from '../Fetcher';
import { Community, Project, Grant, Milestone, MemberOf } from '../entities';
import { Grantee } from '../types/attestations';
export declare class GapIndexerClient extends Fetcher {
    attestation<T = unknown>(uid: `0x${string}`): Promise<Attestation<T, GapSchema>>;
    attestations(schemaName: TSchemaName, search?: string): Promise<IAttestation[]>;
    attestationsOf(schemaName: TSchemaName, attester: `0x${string}`): Promise<IAttestation[]>;
    attestationsTo(schemaName: TSchemaName, recipient: `0x${string}`): Promise<IAttestation[]>;
    communities(search?: string): Promise<Community[]>;
    communitiesByIds(uids: `0x${string}`[]): Promise<Community[]>;
    communityBySlug(slug: string): Promise<Community>;
    communityById(uid: `0x${string}`): Promise<Community>;
    projectBySlug(slug: string): Promise<Project>;
    projectById(uid: `0x${string}`): Promise<Project>;
    projects(name?: string): Promise<Project[]>;
    projectsOf(grantee: `0x${string}`): Promise<Project[]>;
    grantee(address: `0x${string}`): Promise<Grantee>;
    grantees(): Promise<Grantee[]>;
    grantsOf(grantee: `0x${string}`, withCommunity?: boolean): Promise<Grant[]>;
    grantsFor(projects: Project[], withCommunity?: boolean): Promise<Grant[]>;
    grantsForExtProject(projectExtId: string): Promise<Grant[]>;
    grantsByCommunity(uid: `0x${string}`): Promise<Grant[]>;
    milestonesOf(grants: Grant[]): Promise<Milestone[]>;
    membersOf(projects: Project[]): Promise<MemberOf[]>;
    slugExists(slug: string): Promise<boolean>;
}
