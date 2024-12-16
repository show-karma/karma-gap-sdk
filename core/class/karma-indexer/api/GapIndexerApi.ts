import { AxiosGQL } from "../../GraphQL/AxiosGQL";
import {
  Hex,
  IAttestationResponse,
  ICommunityResponse,
  ICommunityAdminsResponse,
  IGrantResponse,
  IProjectResponse,
  ISearchResponse,
  IProjectMilestoneResponse,
} from "./types";

const Endpoints = {
  attestations: {
    all: (prune: boolean = false) => `/attestations?prune=${prune}`,
    byUid: (uid: Hex, prune: boolean = false) =>
      `/attestations/${uid}?prune=${prune}`,
  },
  communities: {
    all: (prune: boolean = false) => `/communities?prune=${prune}`,
    admins: (uid: string, prune: boolean = false) =>
      `/communities/${uid}/admins?prune=${prune}`,
    byUidOrSlug: (uidOrSlug: string, prune: boolean = false) =>
      `/communities/${uidOrSlug}?prune=${prune}`,
    grants: (
      uidOrSlug: string,
      page: number = 0,
      pageLimit: number = 100,
      prune: boolean = false
    ) =>
      `/communities/${uidOrSlug}/grants?prune=${prune}${
        page ? `&page=${page}` : ""
      }${pageLimit ? `&pageLimit=${pageLimit}` : ""}`,
  },
  grantees: {
    all: (prune: boolean = false) => `/grantees?prune=${prune}`,
    byAddress: (address: Hex, prune: boolean = false) =>
      `/grantees/${address}?prune=${prune}`,
    grants: (address: Hex, prune: boolean = false) =>
      `/grantees/${address}/grants?prune=${prune}`,
    projects: (address: Hex, prune: boolean = false) =>
      `/grantees/${address}/projects?prune=${prune}`,
    communities: (address: Hex, withGrants: boolean, prune: boolean = false) =>
      `/grantees/${address}/communities?prune=${prune}${
        withGrants ? "&withGrants=true" : ""
      }`,
    adminOf: (address: Hex, prune: boolean = false) =>
      `/grantees/${address}/communities/admin?prune=${prune}`,
  },
  grants: {
    all: (prune: boolean = false) => `/grants?prune=${prune}`,
    byUid: (uid: Hex, prune: boolean = false) =>
      `/grants/${uid}?prune=${prune}`,
    byExternalId: (id: string, prune: boolean = false) =>
      `/grants/external-id/${id}?prune=${prune}`,
  },
  project: {
    all: (prune: boolean = false) => `/projects?prune=${prune}`,
    byUidOrSlug: (uidOrSlug: string, prune: boolean = false) =>
      `/projects/${uidOrSlug}?prune=${prune}`,
    grants: (uidOrSlug: string, prune: boolean = false) =>
      `/projects/${uidOrSlug}/grants?prune=${prune}`,
    milestones: (uidOrSlug: string, prune: boolean = false) =>
      `/projects/${uidOrSlug}/milestones?prune=${prune}`,
    projectMilestones: (uidOrSlug: string, prune: boolean = false) =>
      `/projects/${uidOrSlug}/project-milestones?prune=${prune}`,
  },
  search: {
    all: (prune: boolean = false) => `/search?prune=${prune}`,
  },
};

export class GapIndexerApi extends AxiosGQL {
  constructor(url: string) {
    super(url);
  }

  async attestation(uid: Hex, prune: boolean = false) {
    const response = await this.client.get<IAttestationResponse>(
      Endpoints.attestations.byUid(uid, prune)
    );

    return response;
  }

  async attestations(
    schemaUID: string,
    search?: string,
    prune: boolean = false
  ) {
    const response = await this.client.get<IAttestationResponse[]>(
      Endpoints.attestations.all(prune),
      {
        params: {
          "filter[schemaUID]": schemaUID,
          "filter[data]": search,
        },
      }
    );

    return response;
  }

  async attestationsOf(
    schemaUID: string,
    attester: Hex,
    prune: boolean = false
  ) {
    const response = await this.client.get<IAttestationResponse[]>(
      Endpoints.attestations.all(prune),
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

  async communities(search?: string, prune: boolean = false) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.communities.all(prune),
      {
        params: {
          "filter[name]": search,
        },
      }
    );

    return response;
  }

  async communitiesOf(
    address: Hex,
    withGrants: boolean,
    prune: boolean = false
  ) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.grantees.communities(address, withGrants, prune)
    );
    return response;
  }

  async adminOf(address: Hex, prune: boolean = false) {
    const response = await this.client.get<ICommunityResponse[]>(
      Endpoints.grantees.adminOf(address, prune)
    );
    return response;
  }

  async communityBySlug(slug: string, prune: boolean = false) {
    const response = await this.client.get<ICommunityResponse>(
      Endpoints.communities.byUidOrSlug(slug, prune)
    );

    return response;
  }

  async communityAdmins(uid: Hex, prune: boolean = false) {
    const response = await this.client.get<ICommunityAdminsResponse>(
      Endpoints.communities.admins(uid, prune)
    );

    return response;
  }

  /**
   * Project
   */

  async projectBySlug(slug: string, prune: boolean = false) {
    const response = await this.client.get<IProjectResponse>(
      Endpoints.project.byUidOrSlug(slug, prune)
    );

    return response;
  }

  async search(query: string, prune: boolean = false) {
    const response = await this.client.get<ISearchResponse>(
      Endpoints.search.all(prune),
      {
        params: {
          q: query,
        },
      }
    );

    return response;
  }

  async searchProjects(query: string, prune: boolean = false) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.project.all(prune),
      {
        params: {
          q: query,
        },
      }
    );

    return response;
  }

  async projects(name?: string, prune: boolean = false) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.project.all(prune),
      {
        params: {
          "filter[title]": name,
        },
      }
    );

    return response;
  }

  async projectsOf(grantee: Hex, prune: boolean = false) {
    const response = await this.client.get<IProjectResponse[]>(
      Endpoints.grantees.projects(grantee, prune)
    );

    return response;
  }
  async projectMilestones(uidOrSlug: string, prune: boolean = false) {
    const response = await this.client.get<IProjectMilestoneResponse[]>(
      Endpoints.project.projectMilestones(uidOrSlug, prune)
    );

    return response;
  }

  /**
   * Grantee
   */

  async grantee(address: Hex, prune: boolean = false) {
    // TODO: update response type when the endpoint works
    const response = await this.client.get<any>(
      Endpoints.grantees.byAddress(address, prune)
    );
    return response;
  }

  async grantees(prune: boolean = false) {
    const response = await this.client.get<{
      [key: Hex]: { grants: number; projects: number };
    }>(Endpoints.grantees.all(prune));

    return response;
  }

  /**
   * Grant
   */

  async grantsOf(
    grantee: Hex,
    withCommunity?: boolean,
    prune: boolean = false
  ) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.grantees.grants(grantee, prune)
    );

    return response;
  }

  async grantsFor(
    uid: string,
    withCommunity?: boolean,
    prune: boolean = false
  ) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.project.grants(uid, prune)
    );

    return response;
  }

  async grantsForExtProject(projectExtId: string, prune: boolean = false) {
    const response = await this.client.get<IGrantResponse[]>(
      Endpoints.grants.byExternalId(projectExtId, prune)
    );

    return response;
  }
  async grantBySlug(slug: Hex, prune: boolean = false) {
    const response = await this.client.get<IGrantResponse>(
      Endpoints.grants.byUid(slug, prune)
    );

    return response;
  }

  async grantsByCommunity(
    uid: Hex,
    page: number = 0,
    pageLimit: number = 100,
    prune: boolean = false
  ) {
    const response = await this.client.get<{ data: IGrantResponse[] }>(
      Endpoints.communities.grants(uid, page, pageLimit, prune)
    );

    return response;
  }

  /**
   * Milestone
   */

  async milestonesOf(uid: Hex, prune: boolean = false) {
    const response = await this.client.get(
      Endpoints.project.milestones(uid, prune)
    );

    return response;
  }

  async slugExists(slug: string, prune: boolean = false) {
    try {
      await this.client.get<IProjectResponse>(
        Endpoints.project.byUidOrSlug(slug, prune)
      );
      return true;
    } catch (err) {
      return false;
    }
  }
}
