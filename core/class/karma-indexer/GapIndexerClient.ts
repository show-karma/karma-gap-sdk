import { TSchemaName, IAttestation, TNetwork, Hex } from 'core/types';
import { Attestation } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { Fetcher } from '../Fetcher';
import { Community, Project, Grant, Milestone, MemberOf } from '../entities';
import { Grantee } from '../types/attestations';
import { formatPath } from '../../utils/format-path';

const Endpoints = {
  attestations: {
    all: () => '/attestations',
    byUid: (uid: Hex) => `/attestations/${uid}`,
  },
  communities: {
    all: (page?: number, pageLimit?: number) => formatPath(`/communities`, {page, pageLimit}),
    byUidOrSlug: (uidOrSlug: string) => `/communities/${uidOrSlug}`,
    grants: (uidOrSlug: string, page?: number, pageLimit?: number) => formatPath(`/communities/${uidOrSlug}/grants`, {page, pageLimit})
  },
  grantees: {
    all: () => '/grantees',
    byAddress: (address: Hex) => `/grantees/${address}`,
    grants: (address: Hex) => `/grantees/${address}/grants`,
    projects: (address: Hex) => `/grantees/${address}/projects`,
    communities: (address: Hex, withGrants) => `/grantees/${address}/communities${withGrants ? '?withGrants=true' : ''}`,
  },
  grants: {
    all: () => '/grants',
    byUid: (uid: Hex) => `/grants/${uid}`,
    byExternalId: (id: string) => `/grants/external-id/${id}`,
  },
  project: {
    all: (page?: number, pageLimit?: number) => formatPath(`/projects`, {page, pageLimit}),
    byUidOrSlug: (uidOrSlug: string) => `/projects/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/projects/${uidOrSlug}/grants`,
    milestones: (uidOrSlug: string) => `/projects/${uidOrSlug}/milestones`,
  },
};

export class GapIndexerClient extends Fetcher {
  async attestation<T = unknown>(
    uid: `0x${string}`
  ): Promise<Attestation<T, GapSchema>> {
    const { data } = await this.client.get<IAttestation>(
      Endpoints.attestations.byUid(uid)
    );

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
    const { data } = await this.client.get<IAttestation[]>(
      Endpoints.attestations.all(),
      {
        params: {
          'filter[schemaUID]': this.gap.findSchema(schemaName).uid,
          'filter[data]': search,
        },
      }
    );

    return data || [];
  }

  async attestationsOf(
    schemaName: TSchemaName,
    attester: `0x${string}`
  ): Promise<IAttestation[]> {
    const { data } = await this.client.get<IAttestation[]>(
      Endpoints.attestations.all(),
      {
        params: {
          'filter[schemaUID]': this.gap.findSchema(schemaName).uid,
          'filter[recipient]': attester,
        },
      }
    );

    return data || [];
  }

  attestationsTo(
    schemaName: TSchemaName,
    recipient: `0x${string}`
  ): Promise<IAttestation[]> {
    return this.attestationsOf(schemaName, recipient);
  }

  async communities(search?: string): Promise<Community[]> {
    const { data } = await this.client.get<Community[]>(
      Endpoints.communities.all(),
      {
        params: {
          'filter[name]': search,
        },
      }
    );

    return Community.from(data, this.gap.network);
  }

  async communitiesOf(address: Hex, withGrants: boolean): Promise<Community[]> {
    const { data } = await this.client.get<Community[]>(
      Endpoints.grantees.communities(address, withGrants)
    );

    return Community.from(data, this.gap.network);
  }

  communitiesByIds(uids: `0x${string}`[]): Promise<Community[]> {
    throw new Error('Method not implemented.');
  }

  async communityBySlug(slug: string): Promise<Community> {
    const { data } = await this.client.get<Community>(
      Endpoints.communities.byUidOrSlug(slug)
    );

    return Community.from([data], this.gap.network)[0];
  }

  communityById(uid: `0x${string}`): Promise<Community> {
    return this.communityBySlug(uid);
  }

  async projectBySlug(slug: string): Promise<Project> {
    const { data } = await this.client.get<Project>(
      Endpoints.project.byUidOrSlug(slug)
    );

    return Project.from([data], this.gap.network)[0];
  }

  projectById(uid: `0x${string}`): Promise<Project> {
    return this.projectBySlug(uid);
  }

  async searchProjects(query: string): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(Endpoints.project.all(), {
      params: {
        q: query,
      },
    });

    return Project.from(data, this.gap.network);
  }

  async projects(name?: string): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(Endpoints.project.all(), {
      params: {
        'filter[title]': name,
      },
    });

    return Project.from(data, this.gap.network);
  }

  async projectsOf(grantee: `0x${string}`): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(
      Endpoints.grantees.projects(grantee)
    );

    return Project.from(data, this.gap.network);
  }

  async grantee(address: `0x${string}`): Promise<Grantee> {
    const { data } = await this.client.get<Grantee>(
      Endpoints.grantees.byAddress(address)
    );

    return data;
  }

  async grantees(): Promise<Grantee[]> {
    const { data } = await this.client.get<Grantee[]>(Endpoints.grantees.all());

    return data;
  }

  async grantsOf(
    grantee: `0x${string}`,
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const { data } = await this.client.get<Grant[]>(
      Endpoints.grantees.grants(grantee)
    );

    return Grant.from(data, this.gap.network);
  }

  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const { data } = await this.client.get<Grant[]>(
      Endpoints.project.grants(projects[0].uid)
    );

    return Grant.from(data, this.gap.network);
  }

  async grantsForExtProject(projectExtId: string): Promise<Grant[]> {
    const { data } = await this.client.get<Grant[]>(
      Endpoints.grants.byExternalId(projectExtId)
    );

    return Grant.from(data, this.gap.network);
  }

  async grantsByCommunity(uid: `0x${string}`, page?: number, pageLimit?: number) {
    console.log({uid, page, pageLimit})
    const { data } = await this.client.get<Grant[]>(
      Endpoints.communities.grants(uid, page, pageLimit)
    );

    return Grant.from(data, this.gap.network);
  }

  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const { data } = await this.client.get<Milestone[]>(
      Endpoints.project.milestones(grants[0].uid)
    );

    return Milestone.from(data, this.gap.network);
  }

  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    throw new Error('Method not implemented.');
  }

  async slugExists(slug: string): Promise<boolean> {
    try {
      await this.client.get<Project>(Endpoints.project.byUidOrSlug(slug));

      return true;
    } catch {
      return false;
    }
  }
}
