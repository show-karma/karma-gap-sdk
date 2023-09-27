import { Attestation } from "../Attestation";
import { gqlQueries } from "../../utils/gql-queries";
import { toUnix } from "../../utils/to-unix";
import {
  AttestationRes,
  AttestationsRes,
  Hex,
  IAttestation,
  SchemaRes,
  SchemataRes,
  TSchemaName,
} from "../../types";
import {
  CommunityDetails,
  ExternalLink,
  GrantDetails,
  GrantRound,
  Grantee,
  IMemberDetails,
  ITag,
  MemberDetails,
  MilestoneCompleted,
  ProjectDetails,
  Tag,
} from "../types/attestations";
import { GapSchema } from "../GapSchema";
import { Schema } from "../Schema";
import { EASClient } from "./EASClient";
import { SchemaError } from "../SchemaError";
import { Grant, Milestone, IProject, Project, MemberOf } from "../entities";
import { Community } from "../entities/Community";
import { mapFilter } from "../../utils";

// TODO: Split this class into small ones
export class GAPFetcher extends EASClient {
  /**
   * Fetches all the schemas deployed by an owner
   * @param owner
   */
  async schemas(owner: Hex): Promise<GapSchema[]> {
    const query = gqlQueries.schemata(owner);
    const { schemata } = await this.query<SchemataRes>(query);

    return schemata.map(
      (schema) =>
        new GapSchema({
          name: "",
          schema: Schema.rawToObject(schema.schema),
          uid: schema.uid,
        })
    );
  }

  /**
   * Fetch a single attestation by its UID.
   * @param uid
   */
  async attestation<T = unknown>(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    return Attestation.fromInterface<Attestation<T>>([attestation])[0];
  }

  /**
   * Fetch attestations of a schema.
   * @param schemaName
   * @param search if set, will search decodedDataJson by the value.
   * @returns
   */
  async attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);

    const query = gqlQueries.attestationsOf(schema.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  /**
   * Fetch attestations of a schema.
   * @param schemaName
   * @param recipient
   * @returns
   */
  async attestationsOf(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsOf(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  /**
   * Fetch attestations of a schema for a specific recipient.
   * @param schemaName
   * @param recipient
   * @returns
   */
  async attestationsTo(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsTo(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  /**
   * Fetch all dependent attestations of a parent schema.
   * @param parentSchema the schema name to get dependents of.
   * @param parentUid the parent uid to get dependents of.
   */
  async dependentsOf(
    parentSchema: TSchemaName,
    parentUid: Hex
  ): Promise<Attestation[]> {
    const parent = GapSchema.find(parentSchema);
    const children = parent.children.map((c) => c.uid);

    if (!children.length)
      throw new SchemaError(
        "INVALID_REFERENCE",
        `Schema ${parentSchema} has no children.`
      );

    const query = gqlQueries.dependentsOf(parentUid, children);
    const { attestations } = await this.query<AttestationsRes>(query);

    return Attestation.fromInterface(attestations);
  }

  /**
   * Fetch all available communities with details and grantees uids.
   *
   * If search is defined, will try to find communities by the search string.
   * @param search
   * @returns
   */
  async communities(search?: string) {
    const [community, communityDetails] = GapSchema.findMany([
      "Community",
      "CommunityDetails",
    ]);

    const query = gqlQueries.attestationsOf(community.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const communities = Attestation.fromInterface<Community>(attestations);

    if (!communities.length) return [];

    return this.communitiesDetails(communities);
  }

  /**
   * Fetch a set of communities by their ids.
   * @param uids
   * @returns
   */
  async communitiesByIds(uids: Hex[]) {
    if (!uids.length) return [];
    const communityDetails = GapSchema.find("CommunityDetails");

    const communityQuery = gqlQueries.attestationsIn(uids);
    const detailsQuery = gqlQueries.dependentsOf(uids, [communityDetails.uid]);
    try {
      const [communities, details] = await Promise.all([
        this.query<AttestationsRes>(communityQuery),
        this.query<AttestationsRes>(detailsQuery),
      ]);

      const communitiesAttestations = Attestation.fromInterface<Community>(
        communities.attestations || []
      );

      const detailsAttestations = Attestation.fromInterface<CommunityDetails>(
        details.attestations || []
      );

      communitiesAttestations.forEach((community) => {
        community.details = detailsAttestations.find(
          (d) => d.refUID === community.uid
        );
      });

      return communitiesAttestations;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get details for a set of communities and returns the updated array.
   * @param communities
   * @returns
   */
  async communitiesDetails(communities: Community[]) {
    const [project, communityDetails] = GapSchema.findMany([
      "Project",
      "CommunityDetails",
    ]);

    const ref = gqlQueries.dependentsOf(
      communities.map((c) => c.uid),
      [communityDetails.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    return communities.map((community) => {
      community.projects = <Project[]>(
        deps.filter(
          (ref) =>
            ref.schema.uid === project.uid && ref.refUID === community.uid
        )
      );

      community.details = <CommunityDetails>(
        deps.find(
          (ref) =>
            ref.schema.uid === communityDetails.uid &&
            ref.refUID === community.uid
        )
      );

      return community;
    });
  }

  /**
   * Fetch a community by its name with details, grants and milestones.
   *
   * It is possible that the resulted community is not the one you are looking for.
   * @param name
   * @returns
   */
  async communityByName(name: string) {
    const communitySchema = GapSchema.find("CommunityDetails");

    const query = gqlQueries.attestationsOf(
      communitySchema.uid,
      this.getSearchFieldString("name", name)
    );
    try {
      const {
        schema: { attestations },
      } = await this.query<SchemaRes>(query);

      if (!attestations.length) throw new Error("Community not found.");

      const communities = Attestation.fromInterface<CommunityDetails>(
        attestations
      ).map((details) => {
        const community = new Community({
          data: { community: true },
          uid: details.refUID,
          schema: communitySchema,
          recipient: details.recipient,
        });

        community.details = details;
        return community;
      });

      const [withDetails] = await this.communitiesDetails(communities);

      if (!withDetails) throw new Error("Community not found.");

      const grants = await this.grantsByCommunity(withDetails.uid);
      withDetails.grants = grants;

      return withDetails;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch a community by its id. This method will also return the
   * community details and projects.
   */
  async communityById(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    if (!attestation) throw new Error("Community not found.");

    const communities = Attestation.fromInterface<Community>([attestation]).map(
      (c) => new Community(c)
    );

    const [withDetails] = await this.communitiesDetails(communities);
    if (!withDetails) throw new Error("Community not found.");
    const grants = await this.grantsByCommunity(uid);
    withDetails.grants = grants;
    return withDetails;
  }

  /**
   * Fetch the details for a set of
   * projects with project grants,
   * members, milestones, and tags.
   * @param projects
   */
  async projectsDetails(projects: Project[]) {
    // Get projects array and fetch details, members, grants, etc then append to the project and return the array.

    const [projectDetails, tag, externalLink] = GapSchema.findMany([
      "ProjectDetails",
      "Tag",
      "ExternalLink",
    ]);

    const refQuery = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [projectDetails.uid, tag.uid, externalLink.uid]
    );

    const [result, members, grants] = await Promise.all([
      this.query<AttestationsRes>(refQuery),
      this.membersOf(projects),
      this.grantsFor(projects, true),
    ]);

    const deps = Attestation.fromInterface(result.attestations || []);

    return projects.map((project) => {
      project.details = <ProjectDetails>(
        deps.find(
          (ref) =>
            ref.schema.uid === projectDetails.uid && ref.refUID === project.uid
        )
      );

      if (project.details) {
        project.details.links = <ExternalLink[]>(
          deps.filter((ref) => ref.schema.uid === externalLink.uid)
        );
      }

      project.tags = mapFilter(
        deps,
        (ref) => ref.schema.uid === tag.uid && ref.refUID === project.uid,
        (ref) =>
          new Tag({
            ...ref,
            data: ref.data as ITag,
          })
      );

      project.members = members.filter((m) => m.refUID === project.uid);

      project.grants = grants.filter((g) => g.refUID === project.uid);

      return project;
    });
  }

  /**
   * Fetch a project by its id.
   * @param uid
   * @returns
   */
  async projectById(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    if (!attestation) throw new Error("Project not found.");

    const projectAttestation = Attestation.fromInterface<Project>([
      attestation,
    ])[0];

    const [result] = await this.projectsDetails([projectAttestation]);
    return result;
  }

  /**
   * Fetch projects with details and members.
   * @param name if set, will search by the name.
   * @returns
   */
  async projects(name?: string): Promise<Project[]> {
    const result = await this.attestations("Project", name);

    if (!result.length) return [];
    const projects = Attestation.fromInterface<Project>(result);
    return this.projectsDetails(projects);
  }

  /**
   * Fetch projects with details and members.
   * @param grantee the public address of the grantee
   * @returns
   */
  async projectsOf(grantee: Hex): Promise<Project[]> {
    const result = await this.attestationsTo("Project", grantee);

    if (!result.length) return [];
    const projects = Attestation.fromInterface<Project>(result);
    return this.projectsDetails(projects);
  }

  /**
   * Fetch Grantee with details and projects.
   * @param address
   * @param withProjects if true, will get grantee project details.
   * @returns
   */
  async grantee(address: Hex): Promise<Grantee> {
    const projects = await this.projectsOf(address);

    return new Grantee(address, projects);
  }

  /**
   * Fetch all Grantees with details.
   * @returns
   */
  async grantees(): Promise<Grantee[]> {
    const projects = await this.projects();

    return projects.reduce(
      (acc, item) => {
        const hasGrantee = acc.find((g) => g.address === item.recipient);

        if (hasGrantee) hasGrantee.projects.push(item);
        else acc.push(new Grantee(item.recipient, [item]));
        return acc;
      },
      <Grantee[]>[]
    );
  }

  /**
   * Fetches the grantes related to a grantee address (recipient).
   * @param grantee
   * @returns
   */
  async grantsOf(grantee: Hex, withCommunity?: boolean): Promise<Grant[]> {
    const [grant, grantDetails, grantVerified, grantRound] = GapSchema.findMany(
      ["Grant", "GrantDetails", "GrantVerified", "GrantRound"]
    );

    const query = gqlQueries.attestationsTo(grant.uid, grantee);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const grants = Attestation.fromInterface<Grant>(attestations);

    if (!grants.length) return [];

    const ref = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [grantDetails.uid, grantVerified.uid, grantRound.uid],
      grants.map((g) => g.recipient)
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    const milestones = await this.milestonesOf(grants);
    const communities = withCommunity
      ? await this.communitiesByIds(
          mapFilter(
            grants,
            (g) => !!g.communityUID,
            (g) => g.communityUID
          )
        )
      : [];

    return grants.map((grant) => {
      const refs = deps.filter((ref) => ref.refUID === grant.uid);

      grant.round = <GrantRound>(
        refs.find(
          (ref) => ref.schema.uid === grantRound.uid && ref.refUID === grant.uid
        )
      );

      grant.verified = !!refs.find(
        (ref) =>
          ref.schema.uid === grantVerified.uid && ref.refUID === grant.uid
      );

      grant.details = <GrantDetails>(
        refs.find(
          (ref) =>
            ref.schema.uid === grantDetails.uid &&
            ref.refUID === grant.uid &&
            typeof (ref as Milestone).endsAt === "undefined"
        )
      );

      grant.milestones = milestones.filter(
        (m) => m.refUID === grant.uid && typeof m.endsAt !== "undefined"
      );

      grant.community = communities.find((c) => c.uid === grant.communityUID);

      return grant;
    });
  }

  async grantsByCommunity(uid: Hex) {
    const [grant, grantDetails] = GapSchema.findMany(["Grant", "GrantDetails"]);

    const query = gqlQueries.attestations(grantDetails.uid, uid);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const grantsDetails = Attestation.fromInterface<GrantDetails>(
      attestations
    ).map((g) => new GrantDetails(g));

    if (!grantsDetails.length) return [];

    const grantsQuery = gqlQueries.attestationsIn(
      grantsDetails.map((g) => g.refUID)
    );

    const { attestations: grantAttestations } =
      await this.query<AttestationsRes>(grantsQuery);

    const grants = Attestation.fromInterface<Grant>(
      grantAttestations || []
    ).map((g) => new Grant(g));

    const refs = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [grantDetails.uid]
    );

    const results = await this.query<AttestationsRes>(refs);

    const deps = Attestation.fromInterface(results.attestations || []);

    const milestones = await this.milestonesOf(grants);

    return grants.map((grant) => {
      grant.details = <GrantDetails>(
        deps.find(
          (d) =>
            d.refUID === grant.uid &&
            d.schema.uid === grantDetails.uid &&
            typeof (d as Milestone).endsAt === "undefined"
        )
      );

      grant.milestones = milestones.filter(
        (m) => m.refUID === grant.uid && typeof m.endsAt !== "undefined"
      );

      return grant;
    });
  }

  /**
   * Fetch grants for an array of projects with milestones.
   * @param projects
   * @returns
   */
  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const [grant, grantDetails] = GapSchema.findMany([
      "Grant",
      "GrantDetails",
      "Milestone",
      "MilestoneApproved",
      "MilestoneCompleted",
    ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [grant.uid]
    );

    const { attestations: grants } = await this.query<AttestationsRes>(query);

    const grantsWithDetails = Attestation.fromInterface<Grant>(grants).map(
      (g) => new Grant(g)
    );

    const ref = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [grantDetails.uid]
    );

    const { attestations } = await this.query<AttestationsRes>(ref);

    const milestones = await this.milestonesOf(grantsWithDetails);

    const deps = Attestation.fromInterface(attestations);

    grantsWithDetails.forEach((grant) => {
      grant.details = <GrantDetails>(
        deps.find(
          (d) =>
            d.refUID === grant.uid &&
            d.schema.uid === grantDetails.uid &&
            typeof (d as Milestone).endsAt === "undefined"
        )
      );
      grant.milestones = milestones
        .filter(
          (m) => m.refUID === grant.uid && typeof m.endsAt !== "undefined"
        )
        .sort((a, b) => a.endsAt - b.endsAt);
    });

    const communities = withCommunity
      ? await this.communitiesByIds(
          mapFilter(
            grantsWithDetails,
            (g) => !!g.communityUID,
            (g) => g.communityUID
          )
        )
      : [];

    grantsWithDetails.forEach((grant) => {
      grant.community = communities.find((c) => c.uid === grant.communityUID);
    });

    return grantsWithDetails.sort(
      (a, b) =>
        a.milestones?.at(-1)?.endsAt - b.milestones?.at(-1)?.endsAt ||
        a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  /**
   * Fetch projects by related tag names.
   * @param names
   * @returns
   */
  async projectsByTags(names: string[]): Promise<Project[]> {
    const [tag, project] = GapSchema.findMany(["Tag", "Project"]);

    const query = gqlQueries.attestationsOf(tag.uid);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const tags = Attestation.fromInterface<Tag>(attestations).filter((t) =>
      names.includes(t.name)
    );

    if (!tags.length) return [];

    const ref = gqlQueries.dependentsOf(
      tags.map((t) => t.uid),
      [project.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface<Project>(results.attestations || []);

    return deps.filter((ref) => ref.schema.uid === project.uid);
  }

  /**
   * Fetch all milestones related to an array of Grants.
   * @param grants
   * @returns
   */
  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const [milestone, milestoneApproved, milestoneCompleted] =
      GapSchema.findMany([
        "Milestone",
        "MilestoneApproved",
        "MilestoneCompleted",
      ]);

    const query = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [milestone.uid]
    );

    const { attestations } = await this.query<AttestationsRes>(query);

    const milestones = Attestation.fromInterface<Milestone>(attestations)
      .map((milestone) => new Milestone(milestone))
      .filter((m) => typeof m.endsAt !== "undefined");

    if (!milestones.length) return [];

    const ref = gqlQueries.dependentsOf(
      milestones.map((m) => m.uid),
      [milestoneApproved.uid, milestoneCompleted.uid]
    );

    const results = await this.query<AttestationsRes>(ref);

    const deps = Attestation.fromInterface<MilestoneCompleted>(
      results.attestations || []
    ).map((m) => new MilestoneCompleted(m));

    return milestones.map((milestone) => {
      const refs = deps.filter((ref) => ref.refUID === milestone.uid);

      milestone.endsAt = toUnix(milestone.endsAt);

      milestone.completed = deps.find(
        (dep) => dep.type === "completed" && dep.refUID === milestone.uid
      );

      milestone.approved = deps.find(
        (dep) => dep.type === "approved" && dep.refUID === milestone.uid
      );

      milestone.rejected = deps.find(
        (dep) => dep.type === "rejected" && dep.refUID === milestone.uid
      );

      return milestone;
    });
  }

  /**
   * Bulk fetch members with details of an array of Projects.
   * @param projects
   * @returns
   */
  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    const [member, memberDetails] = GapSchema.findMany([
      "MemberOf",
      "MemberDetails",
    ]);

    if (!projects.length) return [];

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [member.uid],
      projects.map((p) => p.attester)
    );

    const results = await this.query<AttestationsRes>(query);

    const members = Attestation.fromInterface<MemberOf>(
      results.attestations || []
    );

    if (members.length) {
      const ref = gqlQueries.dependentsOf(
        members.map((a) => a.uid),
        [memberDetails.uid],
        members.map((a) => a.attester)
      );

      const detailsResult = await this.query<AttestationsRes>(ref);
      const detailsRef = Attestation.fromInterface<MemberDetails>(
        detailsResult.attestations || []
      );

      members.forEach((member) => {
        member.details = detailsRef.find((d) => d.refUID === member.uid);
      });
    }

    return members;
  }

  /**
   * Returns a string to be used to search by a value in `decodedDataJson`.
   * @param field
   * @param value
   */
  private getSearchFieldString(field: string, value: string) {
    return String.raw`\\\\\"${field}\\\\\":\\\\\"${value}\\\\\"`;
  }
}
