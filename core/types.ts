import { BytesLike } from "ethers";
import { SchemaInterface } from "./class/Schema";
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

export type TExternalLink = "twitter" | "github" | "website" | "linkedin";

export type TNetwork =
  // | "mainnet"
  // | "base-goerli"
  // | "optimism"
  // | "optimism-goerli"
  // | "arbitrum"
  "sepolia";

export interface EASNetworkConfig {
  url: string;
  chainId: number;
  contracts: {
    eas: Hex;
    schema: Hex;
  };
  /**
   * A tuple containing the schema name and it's UID for that network
   */
  schemas: Record<TSchemaName, string>;
}

export type IGapSchema = SchemaInterface<TSchemaName>;

export type JSONStr = string;

export interface AttestationRes {
  uid: Hex;
  attester: Hex;
  data: BytesLike;
  decodedDataJson: JSONStr;
  recipient: Hex;
  revoked: boolean;
  timeCreated: number;
  refUID: Hex;
  isOffchain: boolean;
  revocable: boolean;
  revocationTime: number;
}

export interface SchemaRes {
  data: {
    schema: {
      attestations: AttestationRes[];
    };
  };
}

export interface ExternalLink {
  url: string;
  type: TExternalLink;
}

export interface GranteeDetails {
  name: string;
  description: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}

export interface GrantDetails {
  title: string;
  amount: string;
  proposalURL: string;
  asset: [string, bigint];
  description: string;
}

export interface GrantRound {
  name: string;
}

export interface GrantVerified {
  verified: boolean;
}

export interface Grant {
  details: GrantDetails;
  verified: boolean;
  round: GrantRound;
}

export interface MemberDetails {
  name: string;
  profilePictureURL: string;
}

export interface MemberOf {
  details: MemberDetails;
}

export interface Milestone {
  title: string;
  startsAt: Date;
  endsAt: Date;
  description: string;
  completed: boolean;
  approved: boolean;
}

export interface MilestoneCompleted {}
export interface MilestoneApproved {}

export interface Tag {
  name: string;
}

export interface ProjectDetails {
  title: string;
  description: string;
  imageURL: string;
  tags: Tag[];
}
export interface Project {
  details: ProjectDetails;
  members: MemberOf[];
  grants: Grant[];
}

export interface Grantee {
  details: GranteeDetails;
  projects: Project[];
}
