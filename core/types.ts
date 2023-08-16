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
  schemas: Record<TSchemaName, Hex>;
}

export type IGapSchema = SchemaInterface<TSchemaName>;

export type JSONStr = string;

export interface Schemata {
  uid: Hex;
  schema: string;
}

export interface SchemataRes {
  schemata: Schemata[];
}

export interface IAttestation {
  uid: Hex;
  attester: Hex;
  data: BytesLike;
  decodedDataJson: JSONStr;
  recipient: Hex;
  revoked: boolean;
  createdAt: number;
  refUID?: Hex;
  isOffchain: boolean;
  revocable: boolean;
  revocationTime?: number;
  schemaId: Hex;
}

export interface AttestationRes {
  attestation: IAttestation;
}

export interface SchemaRes {
  schema: {
    attestations: IAttestation[];
  };
}

export interface ExternalLink {
  uid: Hex;
  url: string;
  type: TExternalLink;
}

export interface GranteeDetails {
  uid: Hex;
  name: string;
  description: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}

export interface GrantDetails {
  uid: Hex;
  title: string;
  amount: string;
  proposalURL: string;
  asset: [string, bigint];
  description: string;
}

export interface GrantRound {
  uid: Hex;
  name: string;
}

export interface GrantVerified {
  uid: Hex;
  verified: boolean;
}

export interface Grant {
  uid: Hex;
  details: GrantDetails;
  verified: boolean;
  round: GrantRound;
}

export interface MemberDetails {
  uid: Hex;
  name: string;
  profilePictureURL: string;
}

export interface MemberOf {
  uid: Hex;
  details: MemberDetails;
}

export interface Milestone {
  uid: Hex;
  title: string;
  startsAt: Date;
  endsAt: Date;
  description: string;
  completed: boolean;
  approved: boolean;
}

export interface MilestoneCompleted {
  uid: Hex;
}

export interface MilestoneApproved {
  uid: Hex;
}

export interface Tag {
  uid: Hex;
  name: string;
}

export interface ProjectDetails {
  uid: Hex;
  title: string;
  description: string;
  imageURL: string;
  tags: Tag[];
}
export interface Project {
  uid: Hex;
  details: ProjectDetails;
  members: MemberOf[];
  grants: Grant[];
}

export interface Grantee {
  uid: Hex;
  details: GranteeDetails;
  projects: Project[];
}
