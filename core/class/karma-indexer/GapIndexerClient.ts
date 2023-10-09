import { TSchemaName, IAttestation, TNetwork, Hex } from "core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Fetcher } from "../GraphQL/Fetcher";
import { Community, Project, Grant, Milestone, MemberOf } from "../entities";
import { Grantee } from "../types/attestations";

const Endpoints = {
  attestations: {
    all: () => "/attestations",
    byUid: (uid: Hex) => `/attestations/${uid}`,
  },
  communities: {
    all: () => "/communities",
    byUidOrSlug: (uidOrSlug: string) => `/communities/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/communities/${uidOrSlug}/grants`,
  },
  grantees: {
    all: () => "/grantees",
    byAddress: (address: Hex) => `/grantees/${address}`,
    grants: (address: Hex) => `/grantees/${address}/grants`,
    projects: (address: Hex) => `/grantees/${address}/projects`,
  },
  grants: {
    all: () => "/grants",
    byUid: (uid: Hex) => `/grants/${uid}`,
  },
  project: {
    all: () => "/projects",
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

    if (!data) throw new Error("Attestation not found");
    return Attestation.fromInterface<Attestation<T>>([data])[0];
  }

  async attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]> {
    const { data } = await this.client.get<IAttestation[]>(
      Endpoints.attestations.all(),
      {
        params: {
          "filter[schemaUID]": GapSchema.get(schemaName).uid,
          "filter[data]": search,
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
          "filter[schemaUID]": GapSchema.get(schemaName).uid,
          "filter[recipient]": attester,
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
          "filter[name]": search,
        },
      }
    );

    return Community.from(data);
  }

  communitiesByIds(uids: `0x${string}`[]): Promise<Community[]> {
    throw new Error("Method not implemented.");
  }

  async communityBySlug(slug: string): Promise<Community> {
    const { data } = await this.client.get<Community>(
      Endpoints.communities.byUidOrSlug(slug)
    );

    return Community.from([data])[0];
  }

  communityById(uid: `0x${string}`): Promise<Community> {
    return this.communityBySlug(uid);
  }

  async projectBySlug(slug: string): Promise<Project> {
    const { data } = await this.client.get<Project>(
      Endpoints.project.byUidOrSlug(slug)
    );

    return Project.from([data])[0];
  }

  projectById(uid: `0x${string}`): Promise<Project> {
    return this.projectBySlug(uid);
  }

  async projects(name?: string): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(Endpoints.project.all(), {
      params: {
        "filter[title]": name,
      },
    });

    return Project.from(data);
  }

  async projectsOf(grantee: `0x${string}`): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(
      Endpoints.grantees.projects(grantee)
    );

    return Project.from(data);
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

    return Grant.from(data);
  }

  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const { data } = await this.client.get<Grant[]>(
      Endpoints.project.grants(projects[0].uid)
    );

    return Grant.from(data);
  }

  async grantsByCommunity(uid: `0x${string}`) {
    const { data } = await this.client.get<Grant[]>(
      Endpoints.communities.grants(uid)
    );

    return Grant.from(data);
  }

  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const { data } = await this.client.get<Milestone[]>(
      Endpoints.project.milestones(grants[0].uid)
    );

    return Milestone.from(data);
  }

  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    throw new Error("Method not implemented.");
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
