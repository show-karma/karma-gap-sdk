import { TSchemaName, IAttestation, TNetwork } from "core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { Fetcher } from "../GraphQL/Fetcher";
import { Community, Project, Grant, Milestone, MemberOf } from "../entities";
import { Grantee } from "../types/attestations";
import axios, { AxiosInstance } from "axios";

export class GapIndexerClient extends Fetcher {
  constructor(network: TNetwork, url: string) {
    super({ network });
    this.client = axios.create({
      baseURL: url,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  attestation<T = unknown>(
    uid: `0x${string}`
  ): Promise<Attestation<T, GapSchema>> {
    throw new Error("Method not implemented.");
  }
  attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]> {
    throw new Error("Method not implemented.");
  }
  attestationsOf(
    schemaName: TSchemaName,
    recipient: `0x${string}`
  ): Promise<IAttestation[]> {
    throw new Error("Method not implemented.");
  }
  attestationsTo(
    schemaName: TSchemaName,
    recipient: `0x${string}`
  ): Promise<IAttestation[]> {
    throw new Error("Method not implemented.");
  }
  communities(search?: string): Promise<Community[]> {
    throw new Error("Method not implemented.");
  }
  communitiesByIds(uids: `0x${string}`[]): Promise<Community[]> {
    throw new Error("Method not implemented.");
  }
  communityBySlug(slug: string): Promise<Community> {
    throw new Error("Method not implemented.");
  }
  communityById(uid: `0x${string}`): Promise<Community> {
    throw new Error("Method not implemented.");
  }
  projectById(uid: `0x${string}`): Promise<Project> {
    throw new Error("Method not implemented.");
  }
  projectBySlug(slug: string): Promise<Project> {
    throw new Error("Method not implemented.");
  }
  projects(name?: string): Promise<Project[]> {
    throw new Error("Method not implemented.");
  }
  projectsOf(grantee: `0x${string}`): Promise<Project[]> {
    throw new Error("Method not implemented.");
  }
  grantee(address: `0x${string}`): Promise<Grantee> {
    throw new Error("Method not implemented.");
  }
  grantees(): Promise<Grantee[]> {
    throw new Error("Method not implemented.");
  }
  grantsOf(grantee: `0x${string}`, withCommunity?: boolean): Promise<Grant[]> {
    throw new Error("Method not implemented.");
  }
  grantsFor(projects: Project[], withCommunity?: boolean): Promise<Grant[]> {
    throw new Error("Method not implemented.");
  }
  grantsByCommunity(uid: `0x${string}`) {
    throw new Error("Method not implemented.");
  }
  milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    throw new Error("Method not implemented.");
  }
  membersOf(projects: Project[]): Promise<MemberOf[]> {
    throw new Error("Method not implemented.");
  }
  slugExists(slug: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
