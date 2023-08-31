import { Hex, IAttestation, JSONStr } from "../types";
import { Schema } from "./Schema";
import { SchemaItem, SchemaValue } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { GapSchema } from "./GapSchema";
interface AttestationArgs<T = unknown, S extends Schema = Schema> {
    data: T | string;
    schema: S;
    uid?: Hex;
    refUID?: Hex;
    attester?: Hex;
    recipient?: Hex;
    revoked?: boolean;
    revocationTime?: Date | number;
    createdAt?: Date | number;
}
/**
 * Represents the EAS Attestation and provides methods to manage attestations.
 * @example
 *
 * ```ts
 * const grantee = new Attestation({
 *  schema: Schema.get("Grantee"), // Use GapSchema.find("SchemaName") if using default GAP schemas
 *  data: { grantee: true },
 *  uid: "0xabc123",
 * });
 *
 * const granteeDetails = new Attestation({
 *  schema: Schema.get("GranteeDetails"),
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
    revoke(signer: SignerOrProvider): Promise<void>;
    /**
     * Attests this attestation and revokes the previous one.
     * @param signer
     * @param args overridable params
     * @returns attestation UID
     */
    attest(signer: SignerOrProvider, ...args: unknown[]): Promise<void>;
    /**
     * Returns an Attestation instance from a JSON decoded schema.
     * @param data
     * @returns
     */
    static fromDecodedSchema<T>(data: JSONStr): T;
    /**
     * Transform attestation interface-based into class-based.
     */
    static fromInterface<T extends Attestation = Attestation>(attestations: IAttestation[]): T[];
    /**
     * Asserts if schema is valid.
     * > Does not check refUID if `strict = false`. To check refUID use `Schema.validate()`
     * @param args
     */
    protected assert(args: AttestationArgs, strict?: boolean): void;
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
export {};
