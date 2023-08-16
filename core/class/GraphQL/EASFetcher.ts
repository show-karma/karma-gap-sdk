import { gqlQueries } from "../../utils/gql-queries";
import {
  AttestationRes,
  Hex,
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

  async fetchAttestation<T>(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);
    const schema: GapSchema = Schema.get(attestation.schemaId);

    if (!schema)
      throw new SchemaError(
        "INVALID_SCHEMA",
        `Schema with ID ${attestation.schemaId} not found`
      );

    return new Attestation<T, GapSchema>({
      ...attestation,
      data: attestation.decodedDataJson,
      schema,
    });
  }

  async fetchAttestations<T = unknown>(
    schemaName: TSchemaName
  ): Promise<Attestation<T>[]> {
    const schema: GapSchema = Schema.get(schemaName);
    if (!schema) throw new Error(`Schema ${schemaName} not found`);

    const query = gqlQueries.attestations(schema.uid);
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

  async fetchProjects(names?: string[]): Promise<Attestation> {
    const schema: GapSchema = Schema.get("Project");
    if (!schema) throw new Error("Projects schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchGrantees(addresses?: Hex[]): Promise<Attestation> {
    const schema: GapSchema = Schema.get("Grantee");
    if (!schema) throw new Error("Grantees schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchGrantsOf(grantee: Hex): Promise<Attestation[]> {
    const schema: GapSchema = Schema.get("Grant");
    if (!schema) throw new Error("Grant schema not found.");

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
    const schema: GapSchema = Schema.get("Grant");
    if (!schema) throw new Error("Grants schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchProjectByTags(names: string[]): Promise<Attestation> {
    const tag: GapSchema = Schema.get("Tag");
    const project: GapSchema = Schema.get("Project");

    if (!(tag && project)) throw new Error("Project or Tag schema not found.");

    return new Attestation({
      data: "",
      schema: project,
      uid: "0x123",
      createdAt: 0,
    });
  }

  async fetchMilestoneOf(grant: string): Promise<Attestation> {
    const schema: GapSchema = Schema.get("MilestoneOf");
    if (!schema) throw new Error("MilestoneOf schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchMembersOf(project: string): Promise<Attestation> {
    const schema: GapSchema = Schema.get("MembersOf");
    if (!schema) throw new Error("MembersOf schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchMilestoneDetails(uid: Hex): Promise<Attestation> {
    const schema: GapSchema = Schema.get("MilestoneDetails");
    if (!schema) throw new Error("MilestoneDetails schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }

  async fetchMembersDetails(uids: Hex[]): Promise<Attestation> {
    const schema: GapSchema = Schema.get("MembersDetails");
    if (!schema) throw new Error("MembersDetails schema not found.");

    return new Attestation({ data: "", schema, uid: "0x123", createdAt: 0 });
  }
}
