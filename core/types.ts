import { SchemaItem } from "@ethereum-attestation-service/eas-sdk";
export type Hex = `0x${string}`;

export type TSchemaName =
  | "ExternalLink"
  | "Grantee"
  | "GranteeDetails"
  | "Grant"
  | "GrantDetails"
  | "GrantRound"
  | "GrantVerified"
  | "MemberOf"
  | "MemberDetails"
  | "Milestone"
  | "MilestoneCompleted"
  | "MilestoneApproved"
  | "Project"
  | "ProjectDetails"
  | "Tag";

export interface EASNetworkConfig {
  url: string;
  chainId: number;
  contracts: {
    eas: Hex;
    schema: Hex;
  };
  schemas?: Record<TSchemaName, string>;
}

export interface SchemaConfig {
  name: TSchemaName;
  schema: SchemaItem[];
  uid: string;
  references?: TSchemaName;
}

export interface EASClientRes {}

export interface ExternalLink {}
export interface Grantee {}
export interface GranteeDetails {}
export interface Grant {}
export interface GrantDetails {}
export interface GrantRound {}
export interface GrantVerified {}
export interface MemberOf {}
export interface MemberDetails {}
export interface Milestone {}
export interface MilestoneCompleted {}
export interface MilestoneApproved {}
export interface Project {}
export interface ProjectDetails {}
export interface Tag {}
