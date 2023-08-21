import { BytesLike } from "ethers";
import { SchemaInterface } from "./class/Schema";
import { Attestation } from "./class/Attestation";
import { GAPFetcher } from "./class/GraphQL/GAPFetcher";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
export type Hex = `0x${string}`;

export interface AttestArgs<T = unknown> {
  from: Hex;
  to: Hex;
  data: T;
  refUID?: Hex;
  schemaName: TSchemaName;
  signer: SignerOrProvider;
}

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

export type TExternalLink =
  | "twitter"
  | "github"
  | "website"
  | "linkedin"
  | "discord";

export type TNetwork =
  // | "mainnet"
  // | "base-goerli"
  // | "optimism"
  // | "optimism-goerli"
  // | "arbitrum"
  "sepolia";

/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
export abstract class Facade {
  abstract readonly network: TNetwork;
  abstract readonly owner: Hex;
  abstract readonly schemas: SchemaInterface[];
  abstract readonly fetch: GAPFetcher;
  protected static _eas: EAS;

  static get eas() {
    return this._eas;
  }
}

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

export interface AttestationsRes {
  attestations: IAttestation[];
}

export interface SchemaRes {
  schema: {
    attestations: IAttestation[];
  };
}

/** Attestation interfaces */
export class ExternalLink extends Attestation {
  url: string;
  type: TExternalLink;
}

export class GranteeDetails extends Attestation {
  name: string;
  description?: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}

export class GrantDetails extends Attestation {
  title: string;
  amount: string = "0";
  proposalURL: string;
  asset?: [string, bigint];
  description?: string;
}

export class GrantRound extends Attestation {
  name: string;
}

export class GrantVerified extends Attestation {
  verified: boolean;
}

export class Grant extends Attestation {
  details?: GrantDetails;
  verified?: boolean;
  round?: GrantRound;
  milestones: Milestone[] = [];
}

export class MemberDetails extends Attestation {
  name: string;
  profilePictureURL: string;
}

export class MemberOf extends Attestation {
  details?: MemberDetails;
}

export class Milestone extends Attestation<Milestone> {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
  completed: boolean;
  approved: boolean;
}

export class MilestoneCompleted extends Attestation {}
export class MilestoneApproved extends Attestation {}

export class Tag extends Attestation {
  name: string;
}

export class ProjectDetails extends Attestation {
  title: string;
  description: string;
  imageURL: string;
  links: ExternalLink[] = [];
}
export class Project extends Attestation {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[];
  grantee: Grantee;
  tags: Tag[] = [];
}

export class Grantee extends Attestation {
  details?: GranteeDetails;
  projects: Project[] = [];
}
