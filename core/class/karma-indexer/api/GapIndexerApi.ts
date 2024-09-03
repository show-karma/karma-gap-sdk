import { AxiosGQL } from "../../GraphQL/AxiosGQL";
import {
  Hex,
  IAttestationResponse,
  ICommunityResponse,
  ICommunityAdminsResponse,
  IGrantResponse,
  IProjectResponse,
  ISearchResponse,
} from "./types";

const Endpoints = {
  attestations: {
    all: () => "/attestations",
    byUid: (uid: Hex) => `/attestations/${uid}`,
  },
  communities: {
    all: () => "/communities",
    admins: (uid: string) => `/communities/${uid}/admins`,
    byUidOrSlug: (uidOrSlug: string) => `/communities/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/communities/${uidOrSlug}/grants`,
  },
  grantees: {
    all: () => "/grantees",
    byAddress: (address: Hex) => `/grantees/${address}`,
    grants: (address: Hex) => `/grantees/${address}/grants`,
    projects: (address: Hex) => `/grantees/${address}/projects`,
    communities: (address: Hex, withGrants) =>
      `/grantees/${address}/communities${withGrants ? "?withGrants=true" : ""}`,
    adminOf: (address: Hex) => `/grantees/${address}/communities/admin`,
  },
  grants: {
    all: () => "/grants",
    byUid: (uid: Hex) => `/grants/${uid}`,
    byExternalId: (id: string) => `/grants/external-id/${id}`,
  },
  project: {
    all: () => "/projects",
    byUidOrSlug: (uidOrSlug: string) => `/projects/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/projects/${uidOrSlug}/grants`,
    milestones: (uidOrSlug: string) => `/projects/${uidOrSlug}/milestones`,
  },
  search: {
    all: () => "/search",
  },
};

export class GapIndexerApi extends AxiosGQL {
  constructor(url: string) {
    super(url);
  }

  async attestation(uid: Hex) {
    const response = await this.client.get<IAttestationResponse>(
      Endpoints.attestations.byUid(uid)
    );

    return response;
  }

  async attestations(schemaUID: string, search?: string) {
    const response = await this.client.get<IAttestationResponse[]>(
      Endpoints.attestations.all(),
      {
        params: {
          "filter[schemaUID]": schemaUID,
          "filter[data]": search,
        },
      }
    );

    return response;
  }

  async attestationsOf(schemaUID: string, attester: Hex) {
    const response = await this.client.get<IAttestationResponse[]>(
      Endpoints.attestations.all(),
      {
        params: {
          "filter[schemaUID]": schemaUID,
          "filter[recipient]": attester,
        },
      }
    );

    return response;
  }

  /**
   * Community
   */

  async communities(search?: string) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.communities.all(),
      {
        params: {
          "filter[name]": search,
        },
      }
    );

    return response;
  }

  async communitiesOf(address: Hex, withGrants: boolean) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.grantees.communities(address, withGrants)
    );
    return response;
  }

  async adminOf(address: Hex) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.grantees.adminOf(address)
    );
    return response;
  }

  async communityBySlug(slug: string) {
    const response = await this.client.get<ICommunityResponse>(
      Endpoints.communities.byUidOrSlug(slug)
    );

    return response;
  }

  async communityAdmins(uid: Hex) {
    const response = await this.client.get<ICommunityAdminsResponse>(
      Endpoints.communities.admins(uid)
    );

    return response;
  }

  /**
   * Project
   */

  async projectBySlug(slug: string) {
    const response = await this.client.get<IProjectResponse>(
      Endpoints.project.byUidOrSlug(slug)
    );

    return response;
  }

  async search(query: string) {
    const response = await this.client.get<ISearchResponse>(
      Endpoints.search.all(),
      {
        params: {
          q: query,
        },
      }
    );

    return response;
  }

  async searchProjects(query: string) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.project.all(),
      {
        params: {
          q: query,
        },
      }
    );

    return response;
  }

  async projects(name?: string) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.project.all(),
      {
        params: {
          "filter[title]": name,
        },
      }
    );

    return response;
  }

  async projectsOf(grantee: Hex) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.grantees.projects(grantee)
    );

    return response;
  }

  /**
   * Grantee
   */

  async grantee(address: Hex) {
    // TODO: update response type when the endpoint works
    const response = await this.client.get<any>(
      Endpoints.grantees.byAddress(address)
    );
    return response;
  }

  async grantees() {
    const response = await this.client.get<{
      [key: Hex]: { grants: number; projects: number };
    }>(Endpoints.grantees.all());

    return response;
  }

  /**
   * Grant
   */

  async grantsOf(grantee: Hex, withCommunity?: boolean) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.grantees.grants(grantee)
    );

    return response;
  }

  async grantsFor(uid: string, withCommunity?: boolean) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.project.grants(uid)
    );

    return response;
  }

  async grantsForExtProject(projectExtId: string) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.grants.byExternalId(projectExtId)
    );

    return response;
  }
  async grantBySlug(slug: Hex) {
    const response = await this.client.get<IGrantResponse>(
      Endpoints.grants.byUid(slug)
    );

    return response;
  }

  async grantsByCommunity(uid: Hex) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.communities.grants(uid)
    );

    return response;
  }

  /**
   * Milestone
   */

  async milestonesOf(uid: Hex) {
    const response = await this.client.get(Endpoints.project.milestones(uid));

    return response;
  }

  async slugExists(slug: string) {
    try {
      await this.client.get<IProjectResponse>(
        Endpoints.project.byUidOrSlug(slug)
      );
      return true;
    } catch (err) {
      return false;
    }
  }
}
