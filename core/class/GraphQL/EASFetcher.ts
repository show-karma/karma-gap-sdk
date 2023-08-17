import { gqlQueries } from "../../utils/gql-queries";
import {
  AttestationRes,
  AttestationsRes,
  ExternalLink,
  Grant,
  GrantDetails,
  GrantRound,
  GrantVerified,
  Grantee,
  GranteeDetails,
  Hex,
  IAttestation,
  MemberDetails,
  MemberOf,
  Milestone,
  Project,
  ProjectDetails,
  SchemaRes,
  SchemataRes,
  TSchemaName,
  Tag,
} from "../../types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Schema } from "../Schema";
import { EASClient } from "./EASClient";
import { SchemaError } from "../SchemaError";

export class EASFetcher extends EASClient {
  async fetchSchemas(owner: Hex): Promise<GapSchema[]> {
    const query = gqlQueries.schemata(owner);
    const { schemata } = await this.query<SchemataRes>(query);

    return schemata.map(
      (schema) =>
        new GapSchema({
          name: "",
          schema: Schema.abiToObject(schema.schema),
          uid: schema.uid,
        })
    );
  }

  async fetchAttestation<T = unknown>(uid: Hex) {
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
  async fetchAttestations<T = unknown>(
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
   * Fetch attestations of a schema for a specific recipient.
   * @param schemaName
   * @param recipient
   * @returns
   */
  async fetchAttestationsOf<T extends Attestation = Attestation>(
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
   * Fetch all dependent attestations of a parent schema.
   * @param parentSchema the schema name to get dependents of.
   * @param parentUid the parent uid to get dependents of.
   */
  async fetchDependentsOf(
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
   * Fetch projects with details and members.
   * @param name if set, will search by the name.
   * @returns
   */
  async fetchProjects(name?: string): Promise<Attestation[]> {
    const projects = <Project[]>await this.fetchAttestations("Project", name);

    if (!projects.length) return [];

    const [memberOf, memberDetails, projectDetails, extLink, tag] =
      GapSchema.findMany([
        "ProjectDetails",
        "MemberOf",
        "MemberDetails",
        "ExternalLink",
        "Tag",
      ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [memberOf.uid, memberDetails.uid, projectDetails.uid, extLink.uid],
      projects.map((p) => p.attester)
    );

    const results = await this.query<AttestationsRes>(query);
    const deps = Attestation.fromInterface(results.attestations || []);

    const members = await this.fetchMembersOf(projects);
    // TODO: Check if this is necessary or can be done async
    // const grants = await this.fetchGrantsFor(projects);

    return projects.map((project) => {
      const refs = deps.filter((ref) => ref.refUID === project.uid);

      project.details = <ProjectDetails>(
        refs.find(
          (ref) =>
            ref.schema.name === "ProjectDetails" && ref.refUID === project.uid
        )
      );

      project.details.links = <ExternalLink[]>(
        refs.filter((ref) => ref.schema.name === "ExternalLink")
      );

      project.tags = <Tag[]>(
        refs.filter(
          (ref) => ref.schema.uid === tag.uid && ref.refUID === project.uid
        )
      );

      project.members = members.filter((m) => m.refUID === project.uid);
      // TODO: Check if this is necessary or can be done async
      // project.grants = grants.filter((g) => g.refUID === project.uid);

      return project;
    });
  }

  /**
   * Fetch Grantee with details and projects.
   * @param address
   * @param withProjects if true, will get grantee project details.
   * @returns
   */
  async fetchGrantee(address: Hex, withProjects = true): Promise<Grantee> {
    const schema = GapSchema.find("Grantee");

    const query = gqlQueries.attestationsOf(schema.uid, address);
    const {
      schema: { attestations: grantees },
    } = await this.query<SchemaRes>(query);
    const [last] = grantees;

    if (!last) throw new Error("Grantee not found.");

    const refs = await this.fetchDependentsOf("Grantee", last.uid);

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
        this.fetchAttestationsOf("ProjectDetails", last.recipient),
        this.fetchAttestationsOf("ExternalLink", last.recipient),
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
  async fetchGrantees(): Promise<Grantee[]> {
    const schema = GapSchema.find("Grantee");
    const query = gqlQueries.attestationsOf(schema.uid);

    const {
      schema: { attestations: grantees },
    } = await this.query<SchemaRes>(query);

    const refs = await this.fetchDependentsOf("Grantee", grantees[0].uid);

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

  async fetchGrantsOf(grantee: Hex): Promise<Grant[]> {
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

    const milestones = await this.fetchMilestonesOf(grants);

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
  async fetchGrantsFor(projects: Project[]): Promise<Grant[]> {
    const schema: GapSchema = GapSchema.find("Grant");

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [schema.uid]
    );
    const { attestations: grants } = await this.query<AttestationsRes>(query);

    return Attestation.fromInterface<Grant>(grants);
  }

  /**
   * Fetch projects by related tag names.
   * @param names
   * @returns
   */
  async fetchProjectsByTags(names: string[]): Promise<Project[]> {
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
  async fetchMilestonesOf(grants: Grant[]): Promise<Milestone[]> {
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
  async fetchMembersOf(projects: Project[]): Promise<MemberOf[]> {
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
