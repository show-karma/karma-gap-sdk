import { SchemaEncoder, SchemaItem, SchemaValue } from "@ethereum-attestation-service/eas-sdk";
import { AttestArgs, Hex, MultiRevokeArgs, SchemaInterface, SignerOrProvider, TNetwork } from "../types";
import { GAP } from "./GAP";
import { Attestation } from "./Attestation";
/**
 * Represents the EAS Schema and provides methods to encode and decode the schema,
 * and validate the schema references.
 *
 * Also provides a set of static methods to manage the schema list.
 *
 * @example
 * ```
 * // You may or not attribute a schema to a variable.
 * new Schema({
 *  name: "Grantee",
 *  schema: [{ type: "bool", name: "grantee", value: true }],
 *  uid: "0x000000000
 * });
 *
 * const granteeDetails = new Schema({
 *  name: "GranteeDetails",
 *  schema: [
 *    { type: "bool", name: "name", value: null }
 *    { type: "bool", name: "description", value: null }
 *    { type: "bool", name: "imageURL", value: null }
 *  ],
 *  uid: "0x000000000,
 *  references: "Grantee"
 * });
 *
 * // Validate if references are correct and all of them exist.
 * Schema.validate();
 *
 * // Gets the schema by name.
 * const grantee = Schema.get("Grantee");
 *
 * // Sets a single schema value.
 * grantee.setValue("grantee", true);
 *
 * // Sets multiple schema values.
 * granteeDetails.setValues({ name: "John Doe", description: "A description", imageURL: "https://example.com/image.png" });
 *
 * // Gets the schema encoded data, used to create an attestation.
 * const encodedGrantee = grantee.encode();
 *
 * // Verify if schema exists
 * Schema.exists("Grantee"); // true
 * Schema.exists("GranteeDetails"); // true
 * Schema.exists("GranteeDetails2"); // false
 *
 * // Get all schemas.
 * Schema.getAll(); // [grantee, granteeDetails]
 *
 * // Get all schema names.
 * Schema.getNames(); // ["Grantee", "GranteeDetails"]
 *
 * // Get many schemas by name. Throws an error if schema does not exist.
 * Schema.getMany(["Grantee", "GranteeDetails"]); // [grantee, granteeDetails]
 *
 * // Replace all schemas. Throws an error if schema does not exist.
 * Schema.replaceAll([grantee, granteeDetails]);
 *
 * // Replace one schema. This will replace a schema using the inbound schema name.. Throws an error if schema does not exist.
 * Schema.replaceOne(grantee);
 *
 * // Converts a raw schema string (e.g. "uint256 id, string name") to a SchemaItem[].
 * const schema = Schema.rawToObject("uint256 id, string name");
 * ```
 */
export declare abstract class Schema<T extends string = string> implements SchemaInterface<T> {
    protected static schemas: Record<TNetwork, Schema[]>;
    protected encoder: SchemaEncoder;
    private _schema;
    readonly uid: Hex;
    readonly name: string;
    readonly revocable?: boolean;
    readonly references?: T;
    readonly gap: GAP;
    /**
     * Creates a new schema instance
     * @param args
     * @param strict If true, will throw an error if schema reference is not valid. With this option, user should add schemas
     * in a strict order.
     */
    constructor(args: SchemaInterface<T>, gap?: GAP, strict?: boolean, ignoreSchema?: boolean);
    /**
     * Encode the schema to be used as payload in the attestation
     * @returns
     */
    encode(schema?: SchemaItem[]): string;
    /**
     * Set a schema field value.
     * @param key
     * @param value
     */
    setValue(key: string, value: SchemaValue): void;
    /**
     * Tests if the current schema is a JSON Schema.
     *
     * @returns boolean
     */
    isJsonSchema(): boolean;
    private assertField;
    /**
     * Asserts if schema is valid.
     * > Does not check references if `strict = false`. To check references use `Schema.validate()`
     * @param args
     */
    protected assert(args: SchemaInterface, strict?: boolean): void;
    /**
     * Attest off chain data
     * @returns
     */
    attestOffchain({ data, signer, to, refUID }: AttestArgs): Promise<import("@ethereum-attestation-service/eas-sdk").SignedOffchainAttestation>;
    /**
     * Revokes one off chain attestation by its UID.
     * @param uid
     * @param signer
     * @returns
     */
    revokeOffchain(uid: Hex, signer: SignerOrProvider): Promise<import("@ethereum-attestation-service/eas-sdk/dist/transaction").Transaction<bigint>>;
    /**
     * Revokes multiple off chain attestations by their UIDs.
     * @param uids
     * @param signer
     * @returns
     */
    multiRevokeOffchain(uids: Hex[], signer: SignerOrProvider): Promise<import("@ethereum-attestation-service/eas-sdk/dist/transaction").Transaction<bigint[]>>;
    /**
     * Validates and attests a given schema.
     *
     * This function checks a schema against predefined standards or rules. If the 'ipfsKey' parameter is enabled,
     * it uploads the data to the IPFS (InterPlanetary File System). Upon successful upload, the function
     * returns the CID (Content Identifier) within the Attestation Body, providing a reference to the data on IPFS.
     *
     * Usage:
     * - Ensure that the schema to be attested conforms to the required format.
     * - Enable 'ipfsKey' if you wish to store the data on IPFS and retrieve its CID.
     *
     * @param {Object} param0 - An object containing the schema and other optional settings.
     * @returns {Object} An object containing the attestation results, including the CID if 'ipfsKey' is enabled.
     */
    attest<T>({ data, to, signer, refUID, callback, }: AttestArgs<T> & {
        callback?: (status: string) => void;
    }): Promise<Hex>;
    /**
     * Bulk attest a set of attestations.
     * @param signer
     * @param entities
     * @returns
     */
    multiAttest(signer: SignerOrProvider, entities?: Attestation[], callback?: Function): Promise<void>;
    /**
     * Revokes a set of attestations by their UIDs.
     * @param signer
     * @param uids
     * @returns
     */
    multiRevoke(signer: SignerOrProvider, toRevoke: MultiRevokeArgs[]): Promise<void>;
    static exists(name: string, network: TNetwork): Schema<string>;
    /**
     * Adds the schema signature to a shares list. Use Schema.get("SchemaName") to get the schema.
     *
     * __Note that this will make the schema available to all instances
     * of the class AND its data can be overriden by any changes.__
     * @param schemas
     */
    static add<T extends Schema>(network: TNetwork, ...schemas: T[]): void;
    static getAll<T extends Schema>(network: TNetwork): T[];
    static get<N extends string, T extends Schema>(name: N, network: TNetwork): T;
    /**
     * Find many schemas by name and return them as an array in the same order.
     * @param names
     * @returns
     */
    static getMany<N extends string, T extends Schema>(names: N[], network: TNetwork): T[];
    static getNames(network: TNetwork): string[];
    /**
     * Validade references
     * @throws {SchemaError} if any reference is not valid
     * @returns {true} if references are valid
     */
    static validate(network: TNetwork): true;
    /**
     * Replaces the schema list with a new list.
     * @param schemas
     */
    static replaceAll(schemas: Schema[], network: TNetwork): void;
    /**
     * Replaces a schema from the schema list.
     * @throws {SchemaError} if desired schema name does not exist.
     */
    static replaceOne(schema: Schema, network: TNetwork): void;
    /**
     * Transforms the given raw schema to SchemaItem[]
     *
     * @example
     * ```
     * const schema = Schema.rawToObject("uint256 id, string name");
     * // schema = [{ type: "uint256", name: "id", value: null }, { type: "string", name: "name", value: null }]
     * ```
     * @param abi
     * @returns
     */
    static rawToObject(abi: string): SchemaItem[];
    /**
     * Returns the raw schema string.
     * @example
     * ```ts
     * const schema = new Schema({ name: "Grantee", schema: [{ type: "bool", name: "grantee", value: true }], uid: "0x000000000" });
     * schema.raw; // "bool grantee"
     * ```
     */
    get raw(): string;
    get schema(): SchemaItem[];
    /**
     * Get all schemas that references this schema. Note that this
     * will return a reference to the original schema and all
     * the changes made to it will reflect the original instance.
     */
    get children(): Schema<string>[];
    /**
     * Asserts and sets the schema value.
     */
    set schema(schema: SchemaItem[]);
}
