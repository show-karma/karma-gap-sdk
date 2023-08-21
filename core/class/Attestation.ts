import { Hex, IAttestation, JSONStr } from "../types";
import { Schema } from "./Schema";
import { SchemaError } from "./SchemaError";
import {
  SchemaDecodedItem,
  SchemaItem,
  SchemaValue,
} from "@ethereum-attestation-service/eas-sdk";
import { getDate } from "../utils/get-date";
import { GapSchema } from "./GapSchema";

interface AttestationArgs<T = unknown, S extends Schema = Schema> {
  schema: S;
  data: T | string;
  uid: Hex;
  refUID?: string;
  attester?: Hex;
  recipient?: Hex;
  revoked?: boolean;
  revocationTime?: Date | number;
  createdAt: Date | number;
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
export class Attestation<T = unknown, S extends Schema = GapSchema>
  implements AttestationArgs<T, S>
{
  readonly schema: S;
  private _data: T;

  readonly uid: Hex;
  readonly refUID?: string;
  readonly attester?: `0x${string}`;
  readonly recipient?: `0x${string}`;
  readonly revoked?: boolean;
  readonly revocationTime?: Date;
  readonly createdAt: Date;

  private _reference?: Attestation;

  constructor(args: AttestationArgs<T, S>) {
    this.schema = args.schema;

    this._data = this.fromDecodedSchema(args.data);

    this.setValues(this._data);
    this.uid = args.uid;
    this.refUID = args.refUID;
    this.attester = args.attester;
    this.recipient = args.recipient;
    this.revoked = args.revoked;
    this.revocationTime = getDate(args.revocationTime);
    this.createdAt = getDate(args.createdAt);
  }

  /**
   * Encodes the schema.
   * @returns
   */
  encodeSchema() {
    return this.schema.encode();
  }

  /**
   * Sets a field in the schema.
   */
  setValue<K extends keyof T>(key: K, value: SchemaValue) {
    this.schema.setValue(key as string, value);
  }

  /**
   * Set attestation values to be uploaded.
   * @param values
   */
  setValues(values: T) {
    Object.entries(values).forEach(([key, value]) => {
      this[key] = value;
      this.setValue(key as keyof T, value.value || value);
    });
  }

  /**
   * Returns the referenced attestation
   */
  reference<Ref = unknown, RefSchema extends Schema = Schema>() {
    return this._reference as Attestation<Ref, RefSchema>;
  }

  /**
   * Returns the attestation data as a JSON string.
   * @param data
   * @returns
   */
  fromDecodedSchema(data: T | JSONStr): T {
    return typeof data === "string"
      ? Attestation.fromDecodedSchema<T>(data)
      : data;
  }

  // TODO: Revoke method
  /**
   * Revokes attestation. Must be the attester to accomplish this action.
   */
  revoke() {}

  /**
   * Returns an Attestation instance from a JSON decoded schema.
   * @param data
   * @returns
   */
  static fromDecodedSchema<T>(data: JSONStr): T {
    try {
      const parsed: SchemaDecodedItem[] = JSON.parse(data);
      if (parsed && Array.isArray(parsed)) {
        return parsed.reduce((acc, curr) => {
          const { value } = curr.value;
          if (
            curr.type.includes("uint") &&
            ["number", "string", "bigint"].includes(typeof value)
          ) {
            acc[curr.name] = BigInt(value as any);
          } else acc[curr.name] = value;
          return acc;
        }, {}) as T;
      }
      throw new SchemaError(
        "INVALID_DATA",
        "Data must be a valid JSON array string."
      );
    } catch (error) {
      console.error(error);
      throw new SchemaError(
        "INVALID_DATA",
        "Data must be a valid JSON string."
      );
    }
  }

  /**
   * Transform attestation interface-based into class-based.
   */
  static fromInterface<T extends Attestation = Attestation>(
    attestations: IAttestation[]
  ) {
    return attestations.map((attestation) => {
      const schema = Schema.get(attestation.schemaId);
      return <T>new Attestation({
        ...attestation,
        schema,
        data: attestation.decodedDataJson,
      });
    });
  }

  /**
   * Asserts if schema is valid.
   * > Does not check refUID if `strict = false`. To check refUID use `Schema.validate()`
   * @param args
   */
  protected assert(args: AttestationArgs, strict = false) {
    const { schema, uid } = args;

    if (!schema || !(schema instanceof Schema)) {
      throw new SchemaError("MISSING_FIELD", "Schema must be an array.");
    }

    if (!uid) {
      throw new SchemaError("MISSING_FIELD", "Schema uid is required");
    }

    if (strict) Schema.validate();
  }

  get data(): T {
    return this._data;
  }
}
