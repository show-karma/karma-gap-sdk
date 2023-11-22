import {
  AttestationRequestData,
  OffchainAttestationParams,
  SchemaEncoder,
  SchemaItem,
  SchemaValue,
} from "@ethereum-attestation-service/eas-sdk";
import {
  AttestArgs,
  Hex,
  MultiRevokeArgs,
  SchemaInterface,
  TSchemaName,
  SignerOrProvider,
  RawMultiAttestPayload,
  RawAttestationPayload,
} from "../types";
import { AttestationError, SchemaError } from "./SchemaError";
import { ethers } from "ethers";
import { useDefaultAttestation, zeroAddress } from "../consts";
import { GAP } from "./GAP";
import { Attestation } from "./Attestation";
import { GapContract } from "./contract/GapContract";

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
export abstract class Schema<T extends string = string>
  implements SchemaInterface<T>
{
  protected static schemas: Schema[] = [];

  protected encoder: SchemaEncoder;
  private _schema: SchemaItem[] = [];

  readonly uid: Hex;
  readonly name: string;

  readonly revocable?: boolean;
  readonly references?: T;

  /**
   * Creates a new schema instance
   * @param args
   * @param strict If true, will throw an error if schema reference is not valid. With this option, user should add schemas
   * in a strict order.
   */
  constructor(args: SchemaInterface<T>, strict = false, ignoreSchema = false) {
    this.assert(args, strict);

    this._schema = args.schema;
    this.uid = args.uid;
    this.name = args.name;
    this.references = args.references;
    this.revocable = args.revocable || true;

    this.encoder = new SchemaEncoder(this.raw);
  }

  /**
   * Encode the schema to be used as payload in the attestation
   * @returns
   */
  encode(schema?: SchemaItem[]) {
    return this.encoder.encodeData(schema || this.schema);
  }

  /**
   * Set a schema field value.
   * @param key
   * @param value
   */
  setValue(key: string, value: SchemaValue) {
    const idx = this._schema.findIndex((item) => item.name === key);
    if (!~idx)
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${key} not found in schema ${this.name}`
      );

    this.assertField(this._schema[idx], value);
    this._schema[idx].value = value;
  }

  /**
   * Tests if the current schema is a JSON Schema.
   *
   * @returns boolean
   */
  isJsonSchema() {
    return !!this.schema.find((s) => s.name === "json" && s.type === "string");
  }

  private assertField(item: SchemaItem, value: any) {
    const { type, name } = item;

    if (type.includes("uint") && /\D/.test(value)) {
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${name} is of type ${type} but value is not a number.`
      );
    }

    if (
      type.includes("address") &&
      !ethers.utils.isAddress(value) &&
      value !== zeroAddress
    ) {
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${name} is of type ${type} but value is not a valid address.`
      );
    }

    if (type.includes("bytes") && !value.startsWith("0x")) {
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${name} is of type ${type} but value is not a valid hex string.`
      );
    }

    if (
      type.includes("bool") &&
      (!["true", "false", true, false].includes(value) ||
        typeof value !== "boolean")
    ) {
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${name} is of type ${type} but value is not a valid boolean.`
      );
    }

    if (type.includes("tuple") && !Array.isArray(value)) {
      throw new SchemaError(
        "INVALID_SCHEMA_FIELD",
        `Field ${name} is of type ${type} but value is not a valid array.`
      );
    }

    if (type === "string" && name === "json") {
      try {
        JSON.parse(value);
      } catch (error) {
        throw new SchemaError(
          "INVALID_SCHEMA_FIELD",
          `Field ${name} is of type ${type} but value is not a valid JSON string.`
        );
      }
    }
  }

  /**
   * Asserts if schema is valid.
   * > Does not check references if `strict = false`. To check references use `Schema.validate()`
   * @param args
   */
  protected assert(args: SchemaInterface, strict = false) {
    const { name, schema, uid, references } = args;

    if (!name) {
      throw new SchemaError("MISSING_FIELD", "Schema name is required");
    }

    if (!schema && !Array.isArray(schema)) {
      throw new SchemaError("MISSING_FIELD", "Schema must be an array.");
    }

    // if (!uid) {
    //   throw new SchemaError("MISSING_FIELD", "Schema uid is required");
    // }

    if (strict && references && !Schema.exists(references)) {
      throw new SchemaError(
        "INVALID_REFERENCE",
        `Schema ${name} references ${references} but it does not exist.`
      );
    }
  }

  /**
   * Attest off chain data
   * @returns
   */
  async attestOffchain({ data, signer, to, refUID }: AttestArgs) {
    const eas = await GAP.eas.getOffchain();
    const payload = <OffchainAttestationParams>{
      data,
      version: eas.version,
      revocable: this.revocable,
      expirationTime: 0n,
      recipient: to,
      refUID,
      schema: this.raw,
      time: BigInt((Date.now() / 1000).toFixed(0)),
    };
    return eas.signOffchainAttestation(payload, signer as any);
  }

  /**
   * Revokes one off chain attestation by its UID.
   * @param uid
   * @param signer
   * @returns
   */
  async revokeOffchain(uid: Hex, signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    return eas.revokeOffchain(uid);
  }

  /**
   * Revokes multiple off chain attestations by their UIDs.
   * @param uids
   * @param signer
   * @returns
   */
  async multiRevokeOffchain(uids: Hex[], signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    return eas.multiRevokeOffchain(uids);
  }

  /**
   * Attest for a schema.
   * 
   * if "ipfsKey" is enabled, the data will be upload in the IPFS and the CID will be in the Attestation Body.
   * 
   * @param param0
   * @returns
   */
  async attest<T>({ data, to, signer, refUID }: AttestArgs<T>): Promise<Hex> {
    const eas = GAP.eas.connect(signer);

    if (this.references && !refUID)
      throw new AttestationError(
        "INVALID_REFERENCE",
        "Attestation schema references another schema but no reference UID was provided."
      );

    if (this.isJsonSchema()) {
      const ipfsManager = GAP.ipfs;
      if(ipfsManager){
        const ipfsHash = await ipfsManager.save(data);
        const encodedData = ipfsManager.encode(ipfsHash, 0);
        data = encodedData as T;
      }

      this.setValue("json", JSON.stringify(data));
    } else {
      Object.entries(data).forEach(([key, value]) => {
        this.setValue(key, value);
      });
    }

    const payload: RawAttestationPayload = {
      schema: this.uid,
      data: {
        raw: {
          recipient: to,
          expirationTime: 0n,
          revocable: true,
          data: this.schema as any,
          refUID,
          value: 0n,
        },
        payload: {
          recipient: to,
          expirationTime: 0n,
          revocable: true,
          data: this.encode(this.schema),
          refUID,
          value: 0n,
        },
      },
    };

    if (useDefaultAttestation.includes(this.name as TSchemaName)) {
      const tx = await eas.attest({
        schema: this.uid,
        data: payload.data.payload,
      });

      return tx.wait() as Promise<Hex>;
    }

    const uid = await GapContract.attest(signer, payload);

    return uid;
  }

  /**
   * Bulk attest a set of attestations.
   * @param signer
   * @param entities
   * @returns
   */
  async multiAttest(signer: SignerOrProvider, entities: Attestation[] = []) {
    entities.forEach((entity) => {
      if (this.references && !entity.refUID)
        throw new SchemaError(
          "INVALID_REF_UID",
          `Entity ${entity.schema.name} references another schema but no reference UID was provided.`
        );
    });

    const eas = GAP.eas.connect(signer);

    const entityBySchema = entities.reduce(
      (acc, entity) => {
        const schema = entity.schema.uid;
        if (!acc[schema]) acc[schema] = [];
        acc[schema].push(entity);
        return acc;
      },
      {} as Record<string, Attestation[]>
    );

    const payload = Object.entries(entityBySchema).map(([schema, ents]) => ({
      schema,
      data: ents.map((e) => ({
        data: e.schema.encode(),
        refUID: e.refUID,
        recipient: e.recipient,
        expirationTime: 0n,
      })),
    }));

    const tx = await eas.multiAttest(payload, {
      gasLimit: 5000000n,
    });
    return tx.wait();
  }

  /**
   * Revokes a set of attestations by their UIDs.
   * @param signer
   * @param uids
   * @returns
   */
  async multiRevoke(signer: SignerOrProvider, toRevoke: MultiRevokeArgs[]) {
    const groupBySchema = toRevoke.reduce(
      (acc, { uid, schemaId }) => {
        if (!acc[schemaId]) acc[schemaId] = [];
        acc[schemaId].push(uid);
        return acc;
      },
      {} as Record<string, Hex[]>
    );

    const eas = GAP.eas.connect(signer);
    const payload = Object.entries(groupBySchema).map(([schema, uids]) => ({
      schema,
      data: uids.map((uid) => ({ uid })),
    }));

    const tx = await eas.multiRevoke(payload, {
      gasLimit: 5000000n,
    });
    return tx.wait();
  }

  static exists(name: string) {
    return this.schemas.find((schema) => schema.name === name);
  }

  /**
   * Adds the schema signature to a shares list. Use Schema.get("SchemaName") to get the schema.
   *
   * __Note that this will make the schema available to all instances
   * of the class AND its data can be overriden by any changes.__
   * @param schemas
   */
  static add<T extends Schema>(...schemas: T[]) {
    schemas.forEach((schema) => {
      if (!this.exists(schema.name)) this.schemas.push(schema);
      else
        throw new SchemaError(
          "SCHEMA_ALREADY_EXISTS",
          `Schema ${schema.name} already exists.`
        );
    });
  }

  static getAll<T extends Schema>(): T[] {
    return this.schemas as T[];
  }

  static get<N extends string, T extends Schema>(name: N): T {
    const schema = this.schemas.find(
      (schema) => schema.name === name || schema.uid === name
    );

    if (!schema)
      throw new SchemaError(
        "SCHEMA_NOT_FOUND",
        `Schema ${name} not found. Available schemas: ${Schema.getNames()}`
      );

    return schema as T;
  }

  /**
   * Find many schemas by name and return them as an array in the same order.
   * @param names
   * @returns
   */
  static getMany<N extends string, T extends Schema>(names: N[]) {
    return names.map((name) => <T>this.get(name));
  }

  static getNames(): string[] {
    return Schema.schemas.map((schema) => schema.name);
  }

  /**
   * Validade references
   * @throws {SchemaError} if any reference is not valid
   * @returns {true} if references are valid
   */
  static validate(): true {
    const errors: SchemaError[] = [];

    this.schemas.forEach((schema) => {
      if (!schema.references || Schema.exists(schema.references)) return;
      else
        errors.push(
          new SchemaError(
            "INVALID_REFERENCE",
            `Schema ${schema.name} references ${schema.references} but it does not exist.`
          )
        );
    });

    if (errors.length) throw errors;
    return true;
  }

  /**
   * Replaces the schema list with a new list.
   * @param schemas
   */
  static replaceAll(schemas: Schema[]) {
    this.schemas = schemas;
  }

  /**
   * Replaces a schema from the schema list.
   * @throws {SchemaError} if desired schema name does not exist.
   */
  static replaceOne(schema: Schema) {
    const idx = this.schemas.findIndex((item) => schema.name === item.name);
    if (!~idx)
      throw new SchemaError(
        "SCHEMA_NOT_FOUND",
        `Schema ${schema.name} not found.`
      );

    this.schemas[idx] = schema;
  }

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
  static rawToObject(abi: string) {
    const items = abi.trim().replace(/,\s+/gim, ",").split(",");
    const schema: SchemaItem[] = items.map((item) => {
      const [type, name] = item.split(" ");
      return { type, name, value: null };
    });

    return schema;
  }

  /**
   * Returns the raw schema string.
   * @example
   * ```ts
   * const schema = new Schema({ name: "Grantee", schema: [{ type: "bool", name: "grantee", value: true }], uid: "0x000000000" });
   * schema.raw; // "bool grantee"
   * ```
   */
  get raw() {
    return this.schema.map((item) => `${item.type} ${item.name}`).join(",");
  }

  get schema() {
    return this._schema;
  }

  /**
   * Get all schemas that references this schema. Note that this
   * will return a reference to the original schema and all
   * the changes made to it will reflect the original instance.
   */
  get children() {
    return Schema.schemas.filter(
      (schema) =>
        schema.references === this.name || schema.references === this.uid
    );
  }

  /**
   * Asserts and sets the schema value.
   */
  set schema(schema: SchemaItem[]) {
    schema.forEach((item) => {
      this.setValue(item.name, item.value);
    });
  }
}
