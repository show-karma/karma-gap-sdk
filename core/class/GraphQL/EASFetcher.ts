import { Hex } from "../../types";
import { EASClient } from "./EASClient";

// TODO: Map all the methods and if needed, create sepparate entities.
export class EASFetcher extends EASClient {
  fetchSchemas(owner: Hex) {}
  fetchAttestations(schemaUID: string) {}

  fetchProjects(names?: string[]) {}

  fetchGrantees(addresses?: string[]) {}
  fetchGrantsOf(grantee: string) {}
  fetchGrantsOfProject(project: string) {}
  fetchProjectByTags(names: string[]) {}
  fetchMilestoneOf(grant: string) {}
  fetchMembersOf(project: string) {}

  fetchMilestoneDetails(uid: string) {}
  fetchMembersDetails(uid: string[]) {}
}
