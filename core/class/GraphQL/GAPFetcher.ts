import { Attestation } from "../Attestation";
import { gqlQueries } from "../../utils/gql-queries";
import {
  AttestationRes,
  AttestationsRes,
  Hex,
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
  GranteeDetails,
  MemberDetails,
  MemberOf,
  ProjectDetails,
  Tag,
} from "../types/attestations";
import { GapSchema } from "../GapSchema";
import { Schema } from "../Schema";
import { EASClient } from "./EASClient";
import { SchemaError } from "../SchemaError";
import { Grant, Milestone, IProject, Project } from "../entities";
import { Community } from "../entities/Community";

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
  async attestations<T = unknown>(
    schemaName: TSchemaName,
    search?: string
  ): Promise<Attestation<T>[]> {
    const schema = GapSchema.find(schemaName);

    const query = gqlQueries.attestationsOf(schema.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return Attestation.fromInterface<Attestation<T>>(attestations);
  }

  /**
   * Fetch attestations of a schema.
   * @param schemaName
   * @param recipient
   * @returns
   */
  async attestationsOf<T extends Attestation = Attestation>(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<T[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsOf(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return Attestation.fromInterface<T>(attestations);
  }

  /**
   * Fetch attestations of a schema for a specific recipient.
   * @param schemaName
   * @param recipient
   * @returns
   */
  async attestationsTo<T extends Attestation = Attestation>(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<T[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsTo(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return Attestation.fromInterface<T>(attestations);
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
    const [community, communityDetails, grantee] = GapSchema.findMany([
      "Community",
      "CommunityDetails",
      "Grantee",
    ]);

    const query = gqlQueries.attestationsOf(community.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const communities = Attestation.fromInterface<Community>(attestations);

    if (!communities.length) return [];

    const ref = gqlQueries.dependentsOf(
      communities.map((c) => c.uid),
      [grantee.uid, communityDetails.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    return communities.map((community) => {
      const refs = deps.filter((ref) => ref.refUID === community.uid);

      community.grantees = <Grantee[]>(
        refs.filter(
          (ref) =>
            ref.schema.uid === grantee.uid && ref.refUID === community.uid
        )
      );

      community.details = <CommunityDetails>(
        refs.find(
          (ref) =>
            ref.schema.uid === communityDetails.uid &&
            ref.refUID === community.uid
        )
      );

      return community;
    });
  }

  /**
   * Fetch a community by its id. This method will also return the
   * community details and grantees uids.
   */
  async communityById(uid: Hex) {
    const [communityDetails, grantee] = GapSchema.findMany([
      "CommunityDetails",
      "Grantee",
    ]);

    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    const communities = Attestation.fromInterface<Community>([attestation]);

    if (!communities.length) return [];

    const ref = gqlQueries.dependentsOf(
      communities.map((c) => c.uid),
      [grantee.uid, communityDetails.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    const communityAttestation = communities[0];

    communityAttestation.grantees = <Grantee[]>(
      deps.filter(
        (ref) =>
          ref.schema.uid === grantee.uid &&
          ref.refUID === communityAttestation.uid
      )
    );

    communityAttestation.details = <CommunityDetails>(
      deps.find(
        (ref) =>
          ref.schema.uid === communityDetails.uid &&
          ref.refUID === communityAttestation.uid
      )
    );
  }

  /**
   * Fetch a project by its id.
   * @param uid
   * @returns
   */
  async projectById(uid: Hex) {
    const [project, projectDetails, memberOf, tag, externalLink, grant] =
      GapSchema.findMany([
        "Project",
        "ProjectDetails",
        "MemberOf",
        "Tag",
        "ExternalLink",
        "Grant",
      ]);

    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    const refQuery = gqlQueries.dependentsOf(
      [uid],
      [projectDetails.uid, tag.uid, externalLink.uid]
    );
    const projectAttestation = Attestation.fromInterface<Project>([
      attestation,
    ])[0];

    const [result, members, grants] = await Promise.all([
      this.query<AttestationsRes>(refQuery),
      this.membersOf([projectAttestation]),
      this.grantsFor([projectAttestation]),
    ]);
    const deps = Attestation.fromInterface(result.attestations || []);

    projectAttestation.details = <ProjectDetails>(
      deps.find(
        (ref) => ref.schema.name === "ProjectDetails" && ref.refUID === uid
      )
    );

    if (projectAttestation.details) {
      projectAttestation.details.links = <ExternalLink[]>(
        deps.filter((ref) => ref.schema.name === "ExternalLink")
      );
    }

    projectAttestation.tags = <Tag[]>(
      deps.filter((ref) => ref.schema.uid === tag.uid && ref.refUID === uid)
    );

    projectAttestation.members = members;

    projectAttestation.grants = grants;

    return projectAttestation;
  }

  /**
   * Fetch projects with details and members.
   * @param name if set, will search by the name.
   * @returns
   */
  async projects(name?: string): Promise<Project[]> {
    const projects = (await this.attestations("Project", name))?.map(
      (item) =>
        new Project({
          ...item,
          data: <IProject>item.data,
          uid: item.uid,
        })
    );

    if (!projects.length) return [];

    const [memberOf, projectDetails, extLink, tag, grant] = GapSchema.findMany([
      "MemberOf",
      "ProjectDetails",
      "ExternalLink",
      "Tag",
      "Grant",
    ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [memberOf.uid, projectDetails.uid, extLink.uid, grant.uid, tag.uid]
    );

    const results = await this.query<AttestationsRes>(query);
    const deps = Attestation.fromInterface(results.attestations || []);
    const [members, grants] = await Promise.all([
      this.membersOf(projects),
      this.grantsFor(projects),
    ]);

    return projects.map((project) => {
      const refs = deps.filter((ref) => ref.refUID === project.uid);

      project.details = <ProjectDetails>(
        refs.find(
          (ref) =>
            ref.schema.name === "ProjectDetails" && ref.refUID === project.uid
        )
      );

      if (project.details)
        project.details.links = <ExternalLink[]>(
          refs.filter((ref) => ref.schema.name === "ExternalLink")
        );

      project.tags = <Tag[]>(
        refs.filter(
          (ref) => ref.schema.uid === tag.uid && ref.refUID === project.uid
        )
      );

      project.members = members.filter(
        (m) => m.refUID === project.uid && m.schema.uid === memberOf.uid
      );

      project.grants = grants.filter(
        (g) => g.refUID === project.uid && g.schema.uid === grant.uid
      );

      return project;
    });
  }

  /**
   * Fetch projects with details and members.
   * @param name if set, will search by the name.
   * @returns
   */
  async projectsOf(grantee: Hex): Promise<Project[]> {
    const projects = (await this.attestationsTo("Project", grantee))?.map(
      (item) =>
        new Project({
          ...item,
          data: <IProject>item.data,
          uid: item.uid,
        })
    );

    if (!projects.length) return [];

    const [memberOf, projectDetails, extLink, tag, grant] = GapSchema.findMany([
      "MemberOf",
      "ProjectDetails",
      "ExternalLink",
      "Tag",
      "Grant",
    ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [memberOf.uid, projectDetails.uid, extLink.uid, grant.uid, tag.uid]
    );

    const results = await this.query<AttestationsRes>(query);
    const deps = Attestation.fromInterface(results.attestations || []);
    const [members, grants] = await Promise.all([
      this.membersOf(projects),
      this.grantsFor(projects),
    ]);

    return projects.map((project) => {
      const refs = deps.filter((ref) => ref.refUID === project.uid);

      project.details = <ProjectDetails>(
        refs.find(
          (ref) =>
            ref.schema.name === "ProjectDetails" && ref.refUID === project.uid
        )
      );

      if (project.details)
        project.details.links = <ExternalLink[]>(
          refs.filter((ref) => ref.schema.name === "ExternalLink")
        );

      project.tags = <Tag[]>(
        refs.filter(
          (ref) => ref.schema.uid === tag.uid && ref.refUID === project.uid
        )
      );

      project.members = members.filter(
        (m) => m.refUID === project.uid && m.schema.uid === memberOf.uid
      );

      project.grants = grants.filter(
        (g) => g.refUID === project.uid && g.schema.uid === grant.uid
      );

      return project;
    });
  }

  /**
   * Fetch Grantee with details and projects.
   * @param address
   * @param withProjects if true, will get grantee project details.
   * @returns
   */
  async grantee(address: Hex, withProjects = true): Promise<Grantee> {
    const schema = GapSchema.find("Grantee");

    const query = gqlQueries.attestationsTo(schema.uid, address);
    const {
      schema: { attestations: grantees },
    } = await this.query<SchemaRes>(query);
    const [last] = grantees;

    if (!last) throw new Error("Grantee not found.");

    const refs = await this.dependentsOf("Grantee", last.uid);

    const grantee = new Grantee({
      ...last,
      data: last.decodedDataJson,
      schema,
    });

    grantee.details = <GranteeDetails>(
      refs.find((r) => r.schema.name === "GranteeDetails")
    );

    grantee.projects = <Project[]>(
      refs.filter((r) => r.schema.name === "Project")
    );

    if (grantee.projects.length && withProjects) {
      const [projects, links] = await Promise.all([
        this.attestationsOf("ProjectDetails", last.recipient),
        this.attestationsOf("ExternalLink", last.recipient),
      ]);

      grantee.projects.forEach((p) => {
        const details = projects.find((d) => d.refUID === p.uid);
        if (details) {
          p.details = <ProjectDetails>details.data;
          p.details.links = <ExternalLink[]>(
            links.filter((l) => l.refUID === p.uid)
          );
        }
      });
    }

    return grantee;
  }

  /**
   * Fetch all Grantees with details.
   * @returns
   */
  async grantees(): Promise<Grantee[]> {
    const schema = GapSchema.find("Grantee");
    const query = gqlQueries.attestationsOf(schema.uid);

    const {
      schema: { attestations: grantees },
    } = await this.query<SchemaRes>(query);

    const refs = await this.dependentsOf("Grantee", grantees[0].uid);

    return grantees.map((grantee) => {
      const granteeDetails = <GranteeDetails>(
        refs.find((r) => r.schema.name === "GranteeDetails")
      );

      const withDetails = new Grantee({
        ...grantee,
        data: grantee.decodedDataJson,
        schema,
      });
      withDetails.details = granteeDetails;

      return withDetails;
    });
  }

  /**
   * Fetches the grantes related to a grantee address (recipient).
   * @param grantee
   * @returns
   */
  async grantsOf(grantee: Hex): Promise<Grant[]> {
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
            ref.schema.uid === grantDetails.uid && ref.refUID === grant.uid
        )
      );

      grant.milestones = milestones.filter((m) => m.refUID === grant.uid);

      return grant;
    });
  }

  /**
   * Fetch grants for an array of projects.
   * @param projects
   * @returns
   */
  async grantsFor(projects: Project[]): Promise<Grant[]> {
    const [
      grant,
      grantDetails,
      milestone,
      milestoneApproved,
      milestoneCompleted,
    ] = GapSchema.findMany([
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

    const grantsWithDetails = Attestation.fromInterface<Grant>(grants);

    const ref = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [
        grantDetails.uid,
        milestone.uid,
        milestoneApproved.uid,
        milestoneCompleted.uid,
      ]
    );

    const { attestations } = await this.query<AttestationsRes>(ref);

    const deps = Attestation.fromInterface(attestations);

    grantsWithDetails.forEach((grant) => {
      grant.details = <GrantDetails>(
        deps.find(
          (d) => d.refUID === grant.uid && d.schema.uid === grantDetails.uid
        )
      );

      grant.milestones = <Milestone[]>deps
        .filter((d) => d.refUID === grant.uid && d.schema.uid === milestone.uid)
        .map((milestone: Milestone) => {
          const refs = deps.filter((ref) => ref.refUID === milestone.uid);
          const startsAt = milestone.startsAt as unknown as bigint;
          const endsAt = milestone.endsAt as unknown as bigint;

          milestone.startsAt = Number(startsAt);
          milestone.endsAt = Number(endsAt);

          milestone.approved = !!refs.find(
            (ref) =>
              ref.schema.uid === milestoneApproved.uid &&
              ref.refUID === milestone.uid
          );

          milestone.completed = !!refs.find(
            (ref) =>
              ref.schema.uid === milestoneCompleted.uid &&
              ref.refUID === milestone.uid
          );

          return milestone;
        });
    });

    return grantsWithDetails;
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

    const milestones = Attestation.fromInterface<Milestone>(attestations);

    if (!milestones.length) return [];

    const ref = gqlQueries.dependentsOf(
      milestones.map((m) => m.uid),
      [milestoneApproved.uid, milestoneCompleted.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    return milestones.map((milestone) => {
      const refs = deps.filter((ref) => ref.refUID === milestone.uid);

      milestone.approved = !!refs.find(
        (ref) =>
          ref.schema.uid === milestoneApproved.uid &&
          ref.refUID === milestone.uid
      );

      milestone.completed = !!refs.find(
        (ref) =>
          ref.schema.uid === milestoneCompleted.uid &&
          ref.refUID === milestone.uid
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
}
