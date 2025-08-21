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
  ITrackResponse,
  ITrackAssignmentResponse,
  IProjectTrackResponse,
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
    grants: (uidOrSlug: string, page: number = 0, pageLimit: number = 100) =>
      `/communities/${uidOrSlug}/grants?${page ? `page=${page}` : ""}${
        pageLimit ? `&pageLimit=${pageLimit}` : ""
      }`,
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
    checkSlug: (slug: string) => `/projects/check-slug/${slug}`,
    byUidOrSlug: (uidOrSlug: string) => `/projects/${uidOrSlug}`,
    grants: (uidOrSlug: string) => `/projects/${uidOrSlug}/grants`,
    milestones: (uidOrSlug: string) => `/projects/${uidOrSlug}/milestones`,
    projectMilestones: (uidOrSlug: string) =>
      `/projects/${uidOrSlug}/project-milestones`,
  },
  search: {
    all: () => "/search",
  },
  tracks: {
    all: () => "/tracks",
    byId: (id: string) => `/tracks/${id}`,
    byCommunity: (communityUID: string, includeArchived: boolean = false) =>
      `/tracks?communityUID=${communityUID}${
        includeArchived ? "&includeArchived=true" : ""
      }`,
  },
  programs: {
    tracks: {
      all: (programId: string) => `/programs/${programId}/tracks`,
      assign: (programId: string) => `/programs/${programId}/tracks`,
      remove: (programId: string, trackId: string) =>
        `/programs/${programId}/tracks/${trackId}`,
    },
  },
  projectTracks: {
    all: (projectId: string, programId: string, activeOnly: boolean = true) =>
      `/programs/${programId}/projects/${projectId}/tracks${
        activeOnly ? "" : "?activeOnly=false"
      }`,
    assign: (projectId: string) => `/projects/${projectId}/tracks`,
    remove: (programId: string, projectId: string) =>
      `/programs/${programId}/project/${projectId}/tracks`,
  },
  community: {
    programProjects: (
      communityId: string,
      programId: string,
      trackId?: string
    ) =>
      `/community/${communityId}/program/${programId}/projects${
        trackId ? `?trackId=${trackId}` : ""
      }`,
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
  async projectMilestones(uidOrSlug: string) {
    const response = await this.client.get<IProjectMilestoneResponse[]>(
      Endpoints.project.projectMilestones(uidOrSlug)
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

  async grantsByCommunity(uid: Hex, page: number = 0, pageLimit: number = 100) {
    const response = await this.client.get<{ data: IGrantResponse[] }>(
      Endpoints.communities.grants(uid, page, pageLimit)
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
        Endpoints.project.checkSlug(slug)
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Tracks
   */

  async getTracks(communityUID: string, includeArchived: boolean = false) {
    const response = await this.client.get<ITrackResponse[]>(
      Endpoints.tracks.byCommunity(communityUID, includeArchived)
    );
    return response;
  }

  async getTrackById(id: string) {
    const response = await this.client.get<ITrackResponse>(
      Endpoints.tracks.byId(id)
    );
    return response;
  }

  async createTrack(data: {
    name: string;
    description?: string;
    communityUID: string;
  }) {
    const response = await this.client.post<ITrackResponse>(
      Endpoints.tracks.all(),
      data
    );
    return response;
  }

  async updateTrack(
    id: string,
    data: { name?: string; description?: string; communityUID?: string }
  ) {
    const response = await this.client.put<ITrackResponse>(
      Endpoints.tracks.byId(id),
      data
    );
    return response;
  }

  async archiveTrack(id: string) {
    const response = await this.client.delete<ITrackResponse>(
      Endpoints.tracks.byId(id)
    );
    return response;
  }

  async assignTracksToProgram(programId: string, trackIds: string[]) {
    const response = await this.client.post<ITrackAssignmentResponse[]>(
      Endpoints.programs.tracks.assign(programId),
      { trackIds }
    );
    return response;
  }

  async unassignTrackFromProgram(programId: string, trackId: string) {
    const response = await this.client.delete<ITrackAssignmentResponse>(
      Endpoints.programs.tracks.remove(programId, trackId)
    );
    return response;
  }

  async getTracksForProgram(programId: string) {
    const response = await this.client.get<ITrackResponse[]>(
      Endpoints.programs.tracks.all(programId)
    );
    return response;
  }

  async getTracksForProject(
    projectId: string,
    programId: string,
    activeOnly: boolean = true
  ) {
    const response = await this.client.get<ITrackResponse[]>(
      Endpoints.projectTracks.all(projectId, programId, activeOnly)
    );
    return response;
  }

  async assignTracksToProject(
    projectId: string,
    programId: string,
    trackIds: string[]
  ) {
    const response = await this.client.post<any[]>(
      Endpoints.projectTracks.assign(projectId),
      { trackIds, programId }
    );
    return response;
  }

  async unassignTracksFromProject(
    projectId: string,
    programId: string,
    trackIds: string[]
  ) {
    const response = await this.client.delete<any[]>(
      Endpoints.projectTracks.remove(programId, projectId),
      { data: { trackIds } }
    );
    return response;
  }

  async getProjectsByTrack(
    communityId: string,
    programId: string,
    trackId?: string
  ) {
    const response = await this.client.get<IProjectTrackResponse[]>(
      Endpoints.community.programProjects(communityId, programId, trackId)
    );
    return response;
  }
}
