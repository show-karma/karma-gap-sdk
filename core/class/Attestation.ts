import { Hex, JSONStr, TSchemaName } from "core/types";
import { Schema } from "./Schema";
import { SchemaError } from "./SchemaError";
import { SchemaItem, SchemaValue } from "@ethereum-attestation-service/eas-sdk";

interface AttestationArgs<T = unknown, S extends Schema = Schema> {
  schema: S;
  data: T;
  uid: string;
  references?: string;
  attester?: Hex;
  recipient?: Hex;
  revoked?: boolean;
}

export class Attestation<T = unknown, S extends Schema = Schema>
  implements AttestationArgs<T, S>
{
  readonly schema: S;
  private _data: T;

  readonly uid: string;
  readonly references?: string;
  readonly attester?: `0x${string}`;
  readonly recipient?: `0x${string}`;
  readonly revoked?: boolean;

  private _reference?: Attestation;

  constructor(args: AttestationArgs<T, S> & { data: string }) {
    this.schema = args.schema;

    this._data = this.parseJson(args.data);
    this.setValues(this.data);

    this.uid = args.uid;
    this.references = args.references;
    this.attester = args.attester;
    this.recipient = args.recipient;
    this.revoked = args.revoked;
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
      this.setValue(key as keyof T, value as SchemaValue);
    });
  }

  /**
   * Returns the referenced attestation
   */
  reference<Ref = unknown, RefSchema extends Schema = Schema>() {
    return this._reference as Attestation<Ref, RefSchema>;
  }

  parseJson(data: T | JSONStr): T {
    return typeof data === "string" ? Attestation.parseJson<T>(data) : data;
  }

  static parseJson<T>(data: JSONStr): T {
    try {
      const parsed: SchemaItem[] = JSON.parse(data);
      if (parsed && Array.isArray(parsed)) {
        return parsed.reduce((acc, curr) => {
          const value = curr.value;
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
   * Asserts if schema is valid.
   * > Does not check references if `strict = false`. To check references use `Schema.validate()`
   * @param args
   */
  protected assert(args: AttestationArgs, strict = false) {
    const { schema, uid } = args;

    if (!schema || !(schema instanceof Schema)) {
      throw new SchemaError("MISSING_FIELD", "Schema must be an array.");
    }

    // if (!uid) {
    //   throw new SchemaError("MISSING_FIELD", "Schema uid is required");
    // }
  }

  get data(): T {
    return this._data;
  }
}
