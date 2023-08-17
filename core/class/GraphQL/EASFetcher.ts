import { gqlQueries } from "../../utils/gql-queries";
import {
  AttestationRes,
  AttestationsRes,
  Grantee,
  GranteeDetails,
  Hex,
  IAttestation,
  MemberDetails,
  Project,
  ProjectDetails,
  SchemaRes,
  SchemataRes,
  TSchemaName,
} from "../../types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Schema } from "../Schema";
import { EASClient } from "./EASClient";
import { SchemaError } from "../SchemaError";

// TODO: Map all the methods and if needed, create sepparate entities.
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
    const schema: GapSchema = Schema.get(attestation.schemaId);

    return new Attestation<T, GapSchema>({
      ...attestation,
      data: attestation.decodedDataJson,
      schema,
    });
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
    const schema: GapSchema = GapSchema.find(schemaName);

    const query = gqlQueries.attestationsOf(schema.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations.map(
      (attestation) =>
        new Attestation<T>({
          ...attestation,
          data: attestation.decodedDataJson,
          schema,
        })
    );
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
    const schema: GapSchema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsOf(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations.map(
      (attestation) => <T>new Attestation({
          ...attestation,
          data: attestation.decodedDataJson,
          schema,
        })
    );
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
    const parent: GapSchema = GapSchema.find(parentSchema);
    const children = parent.children.map((c) => c.uid);

    if (!children.length)
      throw new SchemaError(
        "INVALID_REFERENCE",
        `Schema ${parentSchema} has no children.`
      );

    const query = gqlQueries.dependentsOf(parentUid, children);
    const { attestations } = await this.query<AttestationsRes>(query);

    return this.transformAttestations(attestations);
  }

  /**
   * Fetch projects with details and members.
   * @param name if set, will search by the name.
   * @returns
   */
  async fetchProjects(name?: string): Promise<Attestation[]> {
    const projects = <Project[]>await this.fetchAttestations("Project", name);

    if (!projects.length) return [];

    const [memberOf, memberDetails, projectDetails] = GapSchema.findMany([
      "ProjectDetails",
      "MemberOf",
      "MemberDetails",
    ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [memberOf.uid, memberDetails.uid, projectDetails.uid],
      projects.map((p) => p.attester)
    );

    const results = await this.query<AttestationsRes>(query);
    const deps = this.transformAttestations(results.attestations || []);

    return projects.map((project) => {
      const refs = deps.filter((ref) => ref.refUID === project.uid);

      project.details = <ProjectDetails>(
        refs.find(
          (ref) =>
            ref.schema.name === "ProjectDetails" && ref.refUID === project.uid
        )
      );

      project.members = refs.filter((ref) => ref.refUID === memberOf.uid);
      project.members.forEach((member) => {
        member.details = <MemberDetails>(
          refs.find((ref) => ref.refUID === member.uid)
        );
      });

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
    const schema: GapSchema = GapSchema.find("Grantee");

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
      const projects = await this.fetchAttestationsOf(
        "ProjectDetails",
        last.recipient
      );

      grantee.projects.forEach((p) => {
        const details = projects.find((d) => d.refUID === p.uid);
        if (details) p.details = <ProjectDetails>details.data;
      });
    }

    return grantee;
  }

  async fetchGrantees(addresses?: Hex[]): Promise<Attestation> {
    const schema: GapSchema = GapSchema.find("Grantee");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchGrantsOf(grantee: Hex): Promise<Attestation[]> {
    const schema: GapSchema = GapSchema.find("Grant");

    const query = gqlQueries.attestationsOf(schema.uid, grantee);
    const {
      schema: { attestations: grants },
    } = await this.query<SchemaRes>(query);

    return grants.map(
      (grant) =>
        new Attestation<{}, GapSchema>({
          ...grant,
          data: {},
          schema,
        })
    );
  }

  async fetchGrantsOfProject(project: string): Promise<Attestation> {
    const schema: GapSchema = GapSchema.find("Grant");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchProjectByTags(names: string[]): Promise<Attestation> {
    const [tag, project] = GapSchema.findMany(["Tag", "Project"]);

    if (!(tag && project)) throw new Error("Project or Tag schema not found.");

    return new Attestation({
      data: "",
      schema: project,
      uid: "0x123",
      createdAt: 0,
    });
  }

  async fetchMilestoneOf(grant: string): Promise<Attestation> {
    const schema: GapSchema = GapSchema.find("Milestone");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchMembersOf(project: string): Promise<Attestation> {
    const schema: GapSchema = GapSchema.find("MemberOf");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchMembersDetails(uids: Hex[]): Promise<Attestation> {
    const schema: GapSchema = GapSchema.find("MemberDetails");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  /**
   * Transform attestation interface-based into class-based.
   */
  private transformAttestations(attestations: IAttestation[]) {
    return attestations.map((attestation) => {
      const schema: GapSchema = Schema.get(attestation.schemaId);
      return new Attestation({
        ...attestation,
        schema,
        data: attestation.decodedDataJson,
      });
    });
  }
}
