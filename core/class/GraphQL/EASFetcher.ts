import { Hex } from "../../types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Schema } from "../Schema";
import { EASClient } from "./EASClient";

// TODO: Map all the methods and if needed, create sepparate entities.
export class EASFetcher extends EASClient {
  async fetchSchemas<T extends Schema = Schema>(owner: Hex): Promise<T[]> {
    return [];
  }

  async fetchAttestations(schemaName: string): Promise<Attestation> {
    const schema = Schema.get(schemaName);
    if (!schema) throw new Error(`Schema ${schemaName} not found`);

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchProjects(names?: string[]): Promise<Attestation> {
    const schema = Schema.get("Projects");
    if (!schema) throw new Error("Projects schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchGrantees(addresses?: string[]): Promise<Attestation> {
    const schema = Schema.get("Grantees");
    if (!schema) throw new Error("Grantees schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchGrantsOf(grantee: string): Promise<Attestation> {
    const schema = Schema.get("GrantsOf");
    if (!schema) throw new Error("GrantsOf schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchGrantsOfProject(project: string): Promise<Attestation> {
    const schema = Schema.get("GrantsOfProject");
    if (!schema) throw new Error("GrantsOfProject schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchProjectByTags(names: string[]): Promise<Attestation> {
    const schema = Schema.get("ProjectByTags");
    if (!schema) throw new Error("ProjectByTags schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchMilestoneOf(grant: string): Promise<Attestation> {
    const schema = Schema.get("MilestoneOf");
    if (!schema) throw new Error("MilestoneOf schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchMembersOf(project: string): Promise<Attestation> {
    const schema = Schema.get("MembersOf");
    if (!schema) throw new Error("MembersOf schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchMilestoneDetails(uid: string): Promise<Attestation> {
    const schema = Schema.get("MilestoneDetails");
    if (!schema) throw new Error("MilestoneDetails schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }

  async fetchMembersDetails(uid: string[]): Promise<Attestation> {
    const schema = Schema.get("MembersDetails");
    if (!schema) throw new Error("MembersDetails schema not found.");

    return new Attestation({ data: "", schema, uid: "123" });
  }
}
