import { Hex, IAttestation, JSONStr, MultiAttestData, SignerOrProvider, TNetwork } from "../types";
import { Schema } from "./Schema";
import { SchemaItem, SchemaValue } from "@ethereum-attestation-service/eas-sdk";
import { GapSchema } from "./GapSchema";
import { AttestationWithTxHash } from "./types/attestations";
export interface AttestationArgs<T = unknown, S extends Schema = Schema> {
    data: T | string;
    schema: S;
    uid?: Hex;
    refUID?: Hex;
    attester?: Hex;
    recipient: Hex;
    revoked?: boolean;
    revocationTime?: Date | number;
    createdAt?: Date | number;
    chainID?: number;
}
/**
 * Represents the EAS Attestation and provides methods to manage attestations.
 * @example
 *
 * ```ts
 * const grantee = new Attestation({
 *  schema: Schema.get("Grantee", "network-name"), // Use this.schema.gap.findSchema("SchemaName") if using default GAP schemas
 *  data: { grantee: true },
 *  uid: "0xabc123",
 * });
 *
 * const granteeDetails = new Attestation({
 *  schema: Schema.get("GranteeDetails", "optimism"),
 *  data: {
 *    name: "John Doe",
 *    description: "A description",
 *    imageURL: "https://example.com/image.png",
 *  },
 *  uid: "0xab234"
 * );
 *
 * // Return the refferenced attestation
 * const ref = granteeDetails.reference<Grantee>();
 *
 * // Revoke attestation
 * granteeDetails.revoke();
 *
 * // Get attestation data from a decoded JSON string.
 * granteeDetails.fromDecodedSchema(granteeDetails.data);
 * ```
 */
export declare class Attestation<T = unknown, S extends Schema = GapSchema> implements AttestationArgs<T, S> {
    readonly schema: S;
    private _data;
    protected _uid: Hex;
    readonly refUID?: Hex;
    readonly attester?: Hex;
    readonly recipient: Hex;
    readonly revoked?: boolean;
    readonly revocationTime?: Date;
    readonly createdAt: Date;
    private _chainID;
    private _reference?;
    constructor(args: AttestationArgs<T, S>);
    /**
     * Encodes the schema.
     * @returns
     */
    encodeSchema(schema: SchemaItem[]): string;
    /**
     * Sets a field in the schema.
     */
    setValue<K extends keyof T>(key: K, value: SchemaValue): void;
    /**
     * Set attestation values to be uploaded.
     * @param values
     */
    setValues(values: T): void;
    /**
     * Returns the referenced attestation
     */
    reference<Ref = unknown, RefSchema extends Schema = Schema>(): Attestation<Ref, RefSchema>;
    /**
     * Returns the attestation data as a JSON string.
     * @param data
     * @returns
     */
    fromDecodedSchema(data: T | JSONStr): T;
    /**
     * Revokes this attestation.
     * @param eas
     * @param signer
     * @returns
     */
    revoke(signer: SignerOrProvider, callback?: Function): Promise<void>;
    /**
     * Attests the data using the specified signer and schema.
     * @param signer - The signer or provider to use for attestation.
     * @param args - Additional arguments to pass to the schema's `attest` method.
     * @returns A Promise that resolves to the UID of the attestation.
     * @throws An `AttestationError` if an error occurs during attestation.
     */
    attest(signer: SignerOrProvider, ...args: unknown[]): Promise<AttestationWithTxHash>;
    /**
     * Validates the payload.
     *
     * If an attestation should have anything
     * specifically explicit, it should be implemented in
     * order to avoid errors.
     * @returns
     */
    protected assertPayload(): boolean;
    /**
     * Get the multi attestation payload for the referred index.
     *
     * The index should be the array position this payload wants
     * to reference.
     *
     * E.g:
     *
     * 1. Project is index 0;
     * 2. Project details is index 1;
     * 3. Grant is index 2;
     * 4. Grant details is index 3;
     * 5. Milestone is index 4;
     *
     * `[Project, projectDetails, grant, grantDetails, milestone]`
     *
     * -> Project.payloadFor(0); // refs itself (no effect)
     *
     * -> project.details.payloadFor(0); // ref project
     *
     * -> grant.payloadFor(0); // ref project
     *
     * -> grant.details.payloadFor(2); // ref grant
     *
     * -> milestone.payloadFor(2); // ref grant
     *
     *
     * @param refIdx
     * @returns [Encoded payload, Raw payload]
     */
    payloadFor(refIdx: number): Promise<{
        payload: MultiAttestData;
        raw: MultiAttestData;
    }>;
    /**
     * Returns an Attestation instance from a JSON decoded schema.
     * @param data
     * @returns
     */
    static fromDecodedSchema<T>(data: JSONStr): T;
    /**
     * Transform attestation interface-based into class-based.
     */
    static fromInterface<T extends Attestation = Attestation>(attestations: IAttestation[], network: TNetwork): T[];
    /**
     * Asserts if schema is valid.
     * > Does not check refUID if `strict = false`. To check refUID use `Schema.validate()`
     * @param args
     */
    protected assert(args: AttestationArgs, strict?: boolean): void;
    get chainID(): number;
    get data(): T;
    get uid(): Hex;
    set uid(uid: Hex);
    /**
     * Create attestation to serve as Attestation data.
     * @param data Data to attest
     * @param schema selected schema
     * @param from attester
     * @param to recipient
     * @returns
     */
    static factory<T = unknown>(data: T, schema: Schema, from: Hex, to: Hex): Attestation<T, Schema<string>>;
}
