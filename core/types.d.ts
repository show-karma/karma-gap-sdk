import { BytesLike } from "ethers";
import { GAPFetcher } from "./class/GraphQL/GAPFetcher";
import { EAS, MultiAttestationRequest, SchemaItem } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "./class";
export type Hex = `0x${string}`;
export interface SchemaInterface<T extends string = string> {
    name: string;
    schema: SchemaItem[];
    references?: T;
    uid: Hex;
    revocable?: boolean;
}
export interface MultiRevokeArgs {
    uid: Hex;
    schemaId: Hex;
}
export interface AttestArgs<T = unknown> {
    to: Hex;
    data: T;
    refUID?: Hex;
    signer: SignerOrProvider;
}
export type TSchemaName = "Community" | "CommunityDetails" | "ExternalLink" | "Grant" | "GrantDetails" | "GrantRound" | "GrantVerified" | "MemberOf" | "MemberDetails" | "Milestone" | "MilestoneCompleted" | "MilestoneApproved" | "Project" | "ProjectDetails" | "Tag";
export type TExternalLink = "twitter" | "github" | "website" | "linkedin" | "discord";
export type TNetwork = "sepolia";
/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
export declare abstract class Facade {
    abstract readonly network: TNetwork;
    abstract readonly schemas: SchemaInterface[];
    abstract readonly fetch: GAPFetcher;
    protected static _eas: EAS;
    static get eas(): EAS;
}
export interface MultiAttestData {
    uid?: Hex;
    multiRequest: MultiAttestationRequest;
    refIdx: number;
}
export type MultiAttestPayload = [Attestation, MultiAttestData][];
export interface EASNetworkConfig {
    url: string;
    chainId: number;
    contracts: {
        eas: Hex;
        schema: Hex;
        multicall: Hex;
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
