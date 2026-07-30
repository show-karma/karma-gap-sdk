import { TSchemaName, IAttestation, TNetwork, Hex } from "core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Fetcher } from "../Fetcher";
import {
  Community,
  Project,
  Grant,
  Milestone,
  MemberOf,
  Track,
} from "../entities";
import { Grantee } from "../types/attestations";
import { GapIndexerApi } from "./api/GapIndexerApi";
import {
  ICommunityAdminsResponse,
  ICommunityResponse,
  IGrantResponse,
  IMilestoneResponse,
  IProjectMilestoneResponse,
  IProjectResponse,
} from "./api/types";
import { ProjectMilestone } from "../entities/ProjectMilestone";
import {
  assertAttestationBody,
  assertAttestationList,
  assertIdentifier,
} from "./response-guards";

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
    communities: (address: Hex, withGrants) =>
      `/grantees/${address}/communities${withGrants ? "?withGrants=true" : ""}`,
    communitiesAdmin: (address: Hex, withGrants) =>
      `/grantees/${address}/communities/admin${
        withGrants ? "?withGrants=true" : ""
      }`,
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
    const attestationUid = assertIdentifier("Attestation", "uid", uid);

    const { data } = await this.apiClient.attestation(attestationUid);
    const attestation = assertAttestationBody<IAttestation>(
      "Attestation",
      attestationUid,
      data
    );

    return Attestation.fromInterface<Attestation<T>>(
      [attestation],
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

    return Community.from(
      assertAttestationList<ICommunityResponse>(
        "Communities",
        search ?? "all",
        data
      ),
      this.gap.network
    );
  }

  async communitiesOf(address: Hex, withGrants: boolean): Promise<Community[]> {
    const granteeAddress = assertIdentifier(
      "Communities of grantee",
      "address",
      address
    );

    const { data } = await this.apiClient.communitiesOf(
      granteeAddress,
      withGrants
    );

    return Community.from(
      assertAttestationList<ICommunityResponse>(
        "Communities of grantee",
        granteeAddress,
        data
      ),
      this.gap.network
    );
  }

  async adminOf(address: Hex): Promise<Community[]> {
    const adminAddress = assertIdentifier(
      "Communities administered by",
      "address",
      address
    );

    const { data } = await this.apiClient.adminOf(adminAddress);

    return Community.from(
      assertAttestationList<ICommunityResponse>(
        "Communities administered by",
        adminAddress,
        data
      ),
      this.gap.network
    );
  }

  async communitiesAdminOf(
    address: Hex,
    withGrants: boolean
  ): Promise<Community[]> {
    const adminAddress = assertIdentifier(
      "Communities administered by",
      "address",
      address
    );

    const { data } = await this.client.get<Community[]>(
      Endpoints.grantees.communitiesAdmin(adminAddress, withGrants)
    );

    return Community.from(
      assertAttestationList<ICommunityResponse>(
        "Communities administered by",
        adminAddress,
        data
      ),
      this.gap.network
    );
  }

  communitiesByIds(uids: `0x${string}`[]): Promise<Community[]> {
    throw new Error("Method not implemented.");
  }

  async communityBySlug(slug: string): Promise<Community> {
    const communitySlug = assertIdentifier("Community", "uid or slug", slug);

    const { data } = await this.apiClient.communityBySlug(communitySlug);
    const community = assertAttestationBody<ICommunityResponse>(
      "Community",
      communitySlug,
      data
    );

    return Community.from([community], this.gap.network)[0];
  }

  communityById(uid: `0x${string}`): Promise<Community> {
    return this.communityBySlug(uid);
  }

  async communityAdmins(uid: `0x${string}`): Promise<ICommunityAdminsResponse> {
    const communityUid = assertIdentifier("Community admins", "uid", uid);

    const { data } = await this.apiClient.communityAdmins(communityUid);
    return data;
  }

  async projectBySlug(slug: string): Promise<Project> {
    const projectSlug = assertIdentifier("Project", "uid or slug", slug);

    const { data } = await this.apiClient.projectBySlug(projectSlug);
    const project = assertAttestationBody<IProjectResponse>(
      "Project",
      projectSlug,
      data
    );

    return Project.from([project], this.gap.network)[0];
  }

  projectById(uid: `0x${string}`): Promise<Project> {
    return this.projectBySlug(uid);
  }

  async search(
    query: string
  ): Promise<{ projects: Project[]; communities: Community[] }> {
    const { data } = await this.apiClient.search(query);

    return { data } as unknown as {
      projects: Project[];
      communities: Community[];
    };
  }

  async searchProjects(query: string): Promise<Project[]> {
    const { data } = await this.apiClient.searchProjects(query);

    return Project.from(
      assertAttestationList<IProjectResponse>("Project search", query, data),
      this.gap.network
    );
  }

  async projects(name?: string): Promise<Project[]> {
    const { data } = await this.apiClient.projects(name);

    return Project.from(
      assertAttestationList<IProjectResponse>("Projects", name ?? "all", data),
      this.gap.network
    );
  }

  async projectsOf(grantee: `0x${string}`): Promise<Project[]> {
    const granteeAddress = assertIdentifier(
      "Projects of grantee",
      "address",
      grantee
    );

    const { data } = await this.apiClient.projectsOf(granteeAddress);

    return Project.from(
      assertAttestationList<IProjectResponse>(
        "Projects of grantee",
        granteeAddress,
        data
      ),
      this.gap.network
    );
  }

  async projectMilestones(uidOrSlug: string): Promise<ProjectMilestone[]> {
    const projectRef = assertIdentifier(
      "Project milestones",
      "uid or slug",
      uidOrSlug
    );

    const { data } = await this.apiClient.projectMilestones(projectRef);

    return ProjectMilestone.from(
      assertAttestationList<IProjectMilestoneResponse>(
        "Project milestones",
        projectRef,
        data
      ),
      this.gap.network
    );
  }

  async grantee(address: `0x${string}`): Promise<Grantee> {
    const { data } = await this.apiClient.grantee(address);

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
    const granteeAddress = assertIdentifier(
      "Grants of grantee",
      "address",
      grantee
    );

    const { data } = await this.apiClient.grantsOf(
      granteeAddress,
      withCommunity
    );

    return Grant.from(
      assertAttestationList<IGrantResponse>(
        "Grants of grantee",
        granteeAddress,
        data
      ),
      this.gap.network
    );
  }

  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const projectUid = assertIdentifier(
      "Grants of project",
      "project uid",
      projects?.[0]?.uid
    );

    const { data } = await this.apiClient.grantsFor(projectUid, withCommunity);

    return Grant.from(
      assertAttestationList<IGrantResponse>(
        "Grants of project",
        projectUid,
        data
      ),
      this.gap.network
    );
  }

  async grantsForExtProject(projectExtId: string): Promise<Grant[]> {
    const externalId = assertIdentifier(
      "Grants of external project",
      "external id",
      projectExtId
    );

    const { data } = await this.apiClient.grantsForExtProject(externalId);

    return Grant.from(
      assertAttestationList<IGrantResponse>(
        "Grants of external project",
        externalId,
        data
      ),
      this.gap.network
    );
  }

  async grantsByCommunity(
    uid: `0x${string}`,
    page: number = 0,
    pageLimit: number = 100
  ) {
    const communityUid = assertIdentifier("Grants of community", "uid", uid);

    const { data } = await this.apiClient.grantsByCommunity(
      communityUid,
      page,
      pageLimit
    );

    return Grant.from(
      assertAttestationList<IGrantResponse>(
        "Grants of community",
        communityUid,
        data?.data
      ),
      this.gap.network
    );
  }

  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const grantUid = assertIdentifier(
      "Milestones of grant",
      "grant uid",
      grants?.[0]?.uid
    );

    const { data } = await this.apiClient.milestonesOf(grantUid);

    return Milestone.from(
      assertAttestationList<IMilestoneResponse>(
        "Milestones of grant",
        grantUid,
        data
      ),
      this.gap.network
    );
  }

  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    throw new Error("Method not implemented.");
  }

  async slugExists(
    slug: string,
    type?: "project" | "community"
  ): Promise<boolean> {
    return await this.apiClient.slugExists(slug, type);
  }

  /**
   * Track related methods
   */

  async getTracks(
    communityUID: string,
    includeArchived: boolean = false
  ): Promise<Track[]> {
    const { data } = await this.apiClient.getTracks(
      communityUID,
      includeArchived
    );
    return Track.from(data, this.gap.network);
  }

  async getTrackById(id: string): Promise<Track> {
    const { data } = await this.apiClient.getTrackById(id);
    return Track.from([data], this.gap.network)[0];
  }

  async createTrack(trackData: {
    name: string;
    description?: string;
    communityUID: string;
  }): Promise<Track> {
    const { data } = await this.apiClient.createTrack(trackData);
    return Track.from([data], this.gap.network)[0];
  }

  async updateTrack(
    id: string,
    trackData: { name?: string; description?: string; communityUID?: string }
  ): Promise<Track> {
    const { data } = await this.apiClient.updateTrack(id, trackData);
    return Track.from([data], this.gap.network)[0];
  }

  async archiveTrack(id: string): Promise<Track> {
    const { data } = await this.apiClient.archiveTrack(id);
    return Track.from([data], this.gap.network)[0];
  }

  async assignTracksToProgram(
    programId: string,
    trackIds: string[]
  ): Promise<any[]> {
    const { data } = await this.apiClient.assignTracksToProgram(
      programId,
      trackIds
    );
    return data;
  }

  async unassignTrackFromProgram(
    programId: string,
    trackId: string
  ): Promise<any> {
    const { data } = await this.apiClient.unassignTrackFromProgram(
      programId,
      trackId
    );
    return data;
  }

  async getTracksForProgram(programId: string): Promise<Track[]> {
    const { data } = await this.apiClient.getTracksForProgram(programId);
    return Track.from(data, this.gap.network);
  }

  async getTracksForProject(
    projectId: string,
    programId: string,
    activeOnly: boolean = true
  ): Promise<Track[]> {
    const { data } = await this.apiClient.getTracksForProject(
      projectId,
      programId,
      activeOnly
    );
    return Track.from(data, this.gap.network);
  }

  async assignTracksToProject(
    projectId: string,
    programId: string,
    trackIds: string[]
  ): Promise<any[]> {
    const { data } = await this.apiClient.assignTracksToProject(
      projectId,
      programId,
      trackIds
    );
    return data;
  }

  async unassignTracksFromProject(
    projectId: string,
    programId: string,
    trackIds: string[]
  ): Promise<any[]> {
    const { data } = await this.apiClient.unassignTracksFromProject(
      projectId,
      programId,
      trackIds
    );
    return data;
  }

  async getProjectsByTrack(
    communityId: string,
    programId: string,
    trackId?: string
  ): Promise<any[]> {
    const { data } = await this.apiClient.getProjectsByTrack(
      communityId,
      programId,
      trackId
    );
    return data;
  }
}
