import { BytesLike } from "ethers";
import {
  AttestationRequestData,
  EAS,
  MultiAttestationRequest,
  SchemaItem,
} from "@ethereum-attestation-service/eas-sdk";
// import { SignerOrProvider as EASSigner } from '@ethereum-attestation-service/eas-sdk/dist/transaction';
import { Attestation, GAP } from "./class";
import { Fetcher } from "./class/Fetcher";
export type Hex = `0x${string}`;

export type SignerOrProvider = any;
// EASSigner & {
//   address?: Hex;
//   _address?: Hex;
//   getAddress?: () => Promise<Hex>;
// };

export interface SchemaInterface<T extends string = string> {
  name: string;
  schema: SchemaItem[];
  references?: T;
  uid: Hex;
  revocable?: boolean;
  oldSchemas?: {uid: string; raw: SchemaItem[]}[]; 
}

export interface MultiRevokeArgs {
  uid: Hex;
  schemaId: Hex;
}

export type CallbackStatus = "pending" | "confirmed" | "preparing";

export interface AttestArgs<T = unknown> {
  to: Hex;
  data: T;
  refUID?: Hex;
  signer: SignerOrProvider;
  callback?: (status: CallbackStatus) => void;
}

export type TSchemaName =
  | "Community"
  | "CommunityDetails"
  | "Grant"
  | "GrantDetails"
  | "GrantVerified"
  | "MemberOf"
  | "MemberDetails"
  | "Milestone"
  | "MilestoneCompleted"
  | "MilestoneApproved"
  | "Project"
  | "ProjectDetails"
  | "Details"
  | "ProjectImpact"
  | "ProjectUpdate"
  | "ProjectUpdateStatus"
  | "ProjectPointer"
  | "GrantUpdate"
  | "GrantUpdateStatus"
  | "ProjectEndorsement"
  | "ProjectMilestone"
  | "ProjectMilestoneStatus"
  | "UserSummary";

export type TResolvedSchemaNames =
  | "Community"
  | "Grant"
  | "GrantVerified"
  | "MemberOf"
  | "MilestoneCompleted"
  | "MilestoneApproved"
  | "Project"
  | "Details"
  | "ProjectUpdateStatus"
  | "GrantUpdateStatus"
  | "ProjectUpdateStatus"
  | "ProjectMilestoneStatus"
  | "UserSummary";

export type TExternalLink =
  | "twitter"
  | "github"
  | "website"
  | "linkedin"
  | "discord";

export type TNetwork =
  // | "mainnet"
  // | "base-goerli"
  | "optimism"
  | "celo"
  | "optimism-sepolia"
  | "arbitrum"
  | "sepolia"
  | "sei"
  | "sei-testnet"
  | "base-sepolia";

/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
export abstract class Facade {
  abstract readonly network: TNetwork;
  abstract readonly schemas: SchemaInterface[];
  abstract readonly fetch: Fetcher;
  protected _eas: EAS;

  get eas() {
    return this._eas;
  }
}

export interface RawAttestationPayload {
  schema: Hex;
  data: {
    payload: AttestationRequestData;
    raw: AttestationRequestData;
  };
}

export interface RawMultiAttestPayload {
  payload: MultiAttestData;
  raw: MultiAttestData;
}

export interface MultiAttestData {
  uid?: Hex;
  multiRequest: MultiAttestationRequest;
  refIdx: number;
}

export type MultiAttestPayload = [Attestation, RawMultiAttestPayload][];

export interface EASNetworkConfig {
  url: string;
  rpcUrl: string;
  chainId: number;
  contracts: {
    eas: Hex;
    schema: Hex;
    multicall: Hex;
    projectResolver: Hex;
    communityResolver: Hex;
    donations: Hex;
    airdropNFT: Hex;
  };
  /**
   * A tuple containing the schema name and it's UID for that network
   */
  schemas: Record<TResolvedSchemaNames, Hex>;
  oldSchemas?: {
    name: string;
    uid: string;
    raw: SchemaItem[]
  }[];
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

/**
 * Valid remote storage types
 */
export const enum STORAGE_TYPE {
  IPFS = 0,
  ARWEAVE = 1,
  SWARM = 2,
  UNKNOWN = 3,
}

export type TRemoteStorageOutput<T = unknown> = {
  hash: T;
  storageType: number;
};
