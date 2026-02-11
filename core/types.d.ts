import { BytesLike } from "ethers";
import { AttestationRequestData, EAS, MultiAttestationRequest, SchemaItem } from "@ethereum-attestation-service/eas-sdk";
import { Attestation } from "./class";
import { Fetcher } from "./class/Fetcher";
export type Hex = `0x${string}`;
export type SignerOrProvider = any;
export interface SchemaInterface<T extends string = string> {
    name: string;
    schema: SchemaItem[];
    references?: T;
    uid: Hex;
    revocable?: boolean;
    oldSchemas?: {
        uid: string;
        raw: SchemaItem[];
    }[];
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
export type TSchemaName = "Community" | "CommunityDetails" | "Grant" | "GrantDetails" | "GrantVerified" | "MemberOf" | "MemberDetails" | "Milestone" | "MilestoneCompleted" | "MilestoneApproved" | "Project" | "ProjectDetails" | "Details" | "ProjectImpact" | "ProjectUpdate" | "ProjectUpdateStatus" | "ProjectPointer" | "GrantUpdate" | "GrantUpdateStatus" | "ProjectEndorsement" | "ProjectMilestone" | "ProjectMilestoneStatus" | "ContributorProfile";
export type TResolvedSchemaNames = "Community" | "Grant" | "GrantVerified" | "MemberOf" | "MilestoneCompleted" | "MilestoneApproved" | "Project" | "Details" | "ProjectUpdateStatus" | "GrantUpdateStatus" | "ProjectUpdateStatus" | "ProjectMilestoneStatus" | "ContributorProfile";
export type TExternalLink = "twitter" | "github" | "website" | "linkedin" | "discord" | "pitchDeck" | "demoVideo" | "farcaster" | "custom";
export type TNetwork = "optimism" | "celo" | "optimism-sepolia" | "arbitrum" | "sepolia" | "sei" | "sei-testnet" | "base-sepolia" | "lisk" | "scroll" | "base" | "polygon";
/**
 * Supported chain IDs for GAP SDK networks
 */
export type SupportedChainId = 10 | 11155420 | 42161 | 11155111 | 84532 | 42220 | 1328 | 1329 | 1135 | 534352 | 8453 | 137;
/**
 * RPC configuration for GAP SDK.
 * Maps chain IDs to RPC URLs.
 * Only configure the networks you need to use.
 *
 * @example
 * ```typescript
 * const rpcUrls: GAPRpcConfig = {
 *   10: "https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY",
 *   42161: "https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY",
 * };
 * ```
 */
export type GAPRpcConfig = Partial<Record<SupportedChainId, string>>;
/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
export declare abstract class Facade {
    abstract readonly network: TNetwork;
    abstract readonly schemas: SchemaInterface[];
    abstract readonly fetch: Fetcher;
    protected _eas: EAS;
    get eas(): EAS;
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
        raw: SchemaItem[];
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
