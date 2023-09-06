import {
  Hex,
  IAttestation,
  JSONStr,
  MultiAttestData,
  MultiAttestPayload,
  TSchemaName,
} from "../types";
import { Schema } from "./Schema";
import { AttestationError, SchemaError } from "./SchemaError";
import {
  SchemaDecodedItem,
  SchemaItem,
  SchemaValue,
} from "@ethereum-attestation-service/eas-sdk";
import { getDate } from "../utils/get-date";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { GAP } from "./GAP";
import { GapSchema } from "./GapSchema";
import { nullRef } from "../consts";

interface AttestationArgs<T = unknown, S extends Schema = Schema> {
  data: T | string;
  schema: S;
  uid?: Hex;
  refUID?: Hex;
  attester?: Hex;
  recipient: Hex;
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
export class Attestation<T = unknown, S extends Schema = GapSchema>
  implements AttestationArgs<T, S>
{
  readonly schema: S;
  private _data: T;

  protected _uid: Hex;
  readonly refUID?: Hex;
  readonly attester?: Hex;
  readonly recipient: Hex;
  readonly revoked?: boolean;
  readonly revocationTime?: Date;
  readonly createdAt: Date;

  private _reference?: Attestation;

  constructor(args: AttestationArgs<T, S>) {
    this.schema = args.schema;

    this._data = this.fromDecodedSchema(args.data);

    this.setValues(this._data);
    this._uid = args.uid || nullRef;
    this.refUID = args.refUID || nullRef;
    this.attester = args.attester;
    this.recipient = args.recipient;
    this.revoked = args.revoked;
    this.revocationTime = getDate(args.revocationTime);
    this.createdAt = getDate(args.createdAt || Date.now());
  }

  /**
   * Encodes the schema.
   * @returns
   */
  encodeSchema(schema: SchemaItem[]) {
    return this.schema.encode(schema);
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
    const isJsonSchema = this.schema.isJsonSchema();
    if (isJsonSchema) this.schema.setValue("json", JSON.stringify(values));

    Object.entries(values).forEach(([key, value]) => {
      this[key] = value;
      if (!isJsonSchema) this.setValue(key as keyof T, value.value || value);
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

  /**
   * Revokes this attestation.
   * @param eas
   * @param signer
   * @returns
   */
  async revoke(signer: SignerOrProvider) {
    try {
      const eas = GAP.eas.connect(signer);
      const tx = await eas.revoke({
        data: {
          uid: this.uid,
        },
        schema: this.schema.uid,
      });

      return tx.wait();
    } catch (error) {
      console.error(error);
      throw new SchemaError("REVOKE_ERROR", "Error revoking attestation.");
    }
  }

  /**
   * Attests this attestation and revokes the previous one.
   * @param signer
   * @param args overridable params
   */
  async attest(signer: SignerOrProvider, ...args: unknown[]) {
    console.log(`Attesting ${this.schema.name}`);
    if (this.uid && this.uid !== nullRef) await this.revoke(signer);

    try {
      const uid = await this.schema.attest<T>({
        data: this.data,
        to: this.recipient,
        refUID: this.refUID,
        signer,
      });
      this._uid = uid;
      console.log(`Attested ${this.schema.name} with UID ${uid}`);
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", "Error during attestation.");
    }
  }

  /**
   * Validates the payload.
   *
   * If an attestation should have anything
   * specifically explicit, it should be implemented in
   * order to avoid errors.
   * @returns
   */
  protected assertPayload() {
    return true;
  }

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
   * @returns
   */
  payloadFor(refIdx: number): MultiAttestData {
    this.assertPayload();
    return {
      uid: nullRef,
      refIdx,
      multiRequest: {
        schema: this.schema.uid,
        data: [
          {
            refUID: this.refUID,
            expirationTime: 0n,
            revocable: this.schema.revocable || true,
            value: 0n,
            data: this.schema.encode(),
            recipient: this.recipient,
          },
        ],
      },
    };
  }

  /**
   * Returns an Attestation instance from a JSON decoded schema.
   * @param data
   * @returns
   */
  static fromDecodedSchema<T>(data: JSONStr): T {
    try {
      const parsed: SchemaDecodedItem[] = JSON.parse(data);

      if (data.length < 2 && !/\{.*\}/gim.test(data)) return {} as T;
      if (parsed.length === 1 && parsed[0].name === "json") {
        const { value } = parsed[0];
        return (
          typeof value.value === "string"
            ? JSON.parse(value.value)
            : value.value
        ) as T;
      }

      if (parsed && Array.isArray(parsed)) {
        return parsed.reduce((acc, curr) => {
          const { value } = curr.value;
          if (curr.type.includes("uint")) {
            acc[curr.name] = ["string", "bigint"].includes(typeof value)
              ? BigInt(value as any)
              : Number(value);
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
    const result: T[] = [];
    attestations.forEach((attestation) => {
      try {
        const schema = Schema.get(attestation.schemaId);
        result.push(
          <T>new Attestation({
            ...attestation,
            schema,
            data: attestation.decodedDataJson,
          })
        );
      } catch {}
    });
    return result;
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

  get uid() {
    return this._uid;
  }

  set uid(uid: Hex) {
    this._uid = uid;
  }

  /**
   * Create attestation to serve as Attestation data.
   * @param data Data to attest
   * @param schema selected schema
   * @param from attester
   * @param to recipient
   * @returns
   */
  static factory<T = unknown>(data: T, schema: Schema, from: Hex, to: Hex) {
    return new Attestation({
      data: data,
      recipient: to,
      attester: from,
      schema,
      uid: "0x0",
      createdAt: new Date(),
    });
  }
}
