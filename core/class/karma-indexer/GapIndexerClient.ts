import { TSchemaName, IAttestation, TNetwork, Hex } from 'core/types';
import { Attestation } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { Fetcher } from '../Fetcher';
import { Community, Project, Grant, Milestone, MemberOf } from '../entities';
import { Grantee } from '../types/attestations';
import { GapIndexerApi } from './api/GapIndexerApi';
import { ICommunityResponse } from './api/types';

const Endpoints = {
  attestations: {
    all: () => '/attestations',
    byUid: (uid: Hex) => `/attestations/${uid}`,
  },
  communities: {
    all: () => '/communities',
    byUidOrSlug: (uidOrSlug: string) => `/communities/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/communities/${uidOrSlug}/grants`,
  },
  grantees: {
    all: () => '/grantees',
    byAddress: (address: Hex) => `/grantees/${address}`,
    grants: (address: Hex) => `/grantees/${address}/grants`,
    projects: (address: Hex) => `/grantees/${address}/projects`,
    communities: (address: Hex, withGrants) =>
      `/grantees/${address}/communities${withGrants ? '?withGrants=true' : ''}`,
    communitiesAdmin: (address: Hex, withGrants) =>
      `/grantees/${address}/communities/admin${withGrants ? '?withGrants=true' : ''}`,
  },
  grants: {
    all: () => '/grants',
    byUid: (uid: Hex) => `/grants/${uid}`,
    byExternalId: (id: string) => `/grants/external-id/${id}`,
  },
  project: {
    all: () => '/projects',
    byUidOrSlug: (uidOrSlug: string) => `/projects/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/projects/${uidOrSlug}/grants`,
    milestones: (uidOrSlug: string) => `/projects/${uidOrSlug}/milestones`,
  },
};

export class GapIndexerClient extends Fetcher {
  private apiClient: GapIndexerApi;
  constructor(params) {
    super(params);
    this.apiClient = new GapIndexerApi(params);
  }

  async attestation<T = unknown>(
    uid: `0x${string}`
  ): Promise<Attestation<T, GapSchema>> {
    const { data } = await this.apiClient.attestation(uid);

    if (!data) throw new Error('Attestation not found');
    return Attestation.fromInterface<Attestation<T>>(
      [data],
      this.gap.network
    )[0];
  }

  async attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]> {
    const schemaUID = this.gap.findSchema(schemaName).uid;
    const { data } = await this.apiClient.attestations(schemaUID, search);

    return data || [];
  }

  async attestationsOf(
    schemaName: TSchemaName,
    attester: `0x${string}`
  ): Promise<IAttestation[]> {
    const schemaUID = this.gap.findSchema(schemaName).uid;
    const { data } = await this.apiClient.attestationsOf(schemaUID, attester);

    return data || [];
  }

  attestationsTo(
    schemaName: TSchemaName,
    recipient: `0x${string}`
  ): Promise<IAttestation[]> {
    return this.attestationsOf(schemaName, recipient);
  }

  async communities(search?: string): Promise<Community[]> {
    const { data } = await this.apiClient.communities(search);

    return Community.from(data, this.gap.network);
  }

  async communitiesOf(address: Hex, withGrants: boolean): Promise<Community[]> {
    const {data} = await this.apiClient.communitiesOf(address, withGrants)

    return Community.from(data, this.gap.network);
  }

  async communitiesAdminOf(address: Hex, withGrants: boolean): Promise<Community[]> {
    const { data } = await this.client.get<Community[]>(
      Endpoints.grantees.communitiesAdmin(address, withGrants)
    );

    return Community.from((data as any) as ICommunityResponse[], this.gap.network);
  }

  communitiesByIds(uids: `0x${string}`[]): Promise<Community[]> {
    throw new Error('Method not implemented.');
  }

  async communityBySlug(slug: string): Promise<Community> {
    const {data} = await this.apiClient.communityBySlug(slug);

    return Community.from([data], this.gap.network)[0];
  }

  communityById(uid: `0x${string}`): Promise<Community> {
    return this.communityBySlug(uid);
  }

  async communityAdmins(uid: `0x${string}`): Promise<Community> {
    return this.apiClient.communityAdmins(uid);
  }

  async projectBySlug(slug: string): Promise<Project> {
    const { data } = await this.apiClient.projectBySlug(slug);

    return Project.from([data], this.gap.network)[0];
  }

  projectById(uid: `0x${string}`): Promise<Project> {
    return this.projectBySlug(uid);
  }

  async searchProjects(query: string): Promise<Project[]> {
    const { data } = await this.apiClient.searchProjects(query);

    return Project.from(data, this.gap.network);
  }

  async projects(name?: string): Promise<Project[]> {
    const { data } = await this.apiClient.projects(name);

    return Project.from(data, this.gap.network);
  }

  async projectsOf(grantee: `0x${string}`): Promise<Project[]> {
    const { data } = await this.apiClient.projectsOf(grantee);

    return Project.from(data, this.gap.network);
  }

  async grantee(address: `0x${string}`): Promise<Grantee> {
    const { data } = await this.apiClient.grantee(address)

    return data as Grantee;
  }

  async grantees(): Promise<Grantee[]> {
    const { data } = await this.apiClient.grantees();

    return data as any as Grantee[]; // TODO: Remove this casting after the api is fixed
  }

  async grantsOf(
    grantee: `0x${string}`,
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const { data } = await this.apiClient.grantsOf(grantee, withCommunity);

    return Grant.from(data, this.gap.network);
  }

  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const { data } = await this.apiClient.grantsFor(projects[0].uid, withCommunity)

    return Grant.from(data, this.gap.network);
  }

  async grantsForExtProject(projectExtId: string): Promise<Grant[]> {
    const { data } = await this.apiClient.grantsForExtProject(projectExtId);

    return Grant.from(data, this.gap.network);
  }

  async grantsByCommunity(uid: `0x${string}`) {
    const { data } = await this.apiClient.grantsByCommunity(uid);

    return Grant.from(data, this.gap.network);
  }

  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const { data } = await this.apiClient.milestonesOf(grants[0].uid);

    return Milestone.from(data, this.gap.network);
  }

  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    throw new Error('Method not implemented.');
  }

  async slugExists(slug: string): Promise<boolean> {
    return await this.apiClient.slugExists(slug);
  }
}
