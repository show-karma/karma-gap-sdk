import { SchemaItem } from "@ethereum-attestation-service/eas-sdk";
import { Network } from "../consts";
import { EASClient } from "./GraphQL/EASClient";
import { Hex } from "../types";
import { Schema } from "./Schema";
import { SchemaError } from "./SchemaError";

interface GAPArgs {
  network: keyof typeof Network;
  owner: Hex;
  schemas: Schema[];
}

export class GAP implements GAPArgs {
  private static client: GAP;

  readonly eas: EASClient;
  readonly owner: Hex;
  private _schemas: Schema[];
  readonly network: keyof typeof Network;

  private constructor(args: GAPArgs) {
    this.owner = args.owner;
    this.eas = new EASClient({ network: args.network, owner: args.owner });
    this._schemas = args.schemas;
  }

  /**
   * Creates the attestation payload using a specific schema.
   * @param from
   * @param to
   * @param data
   * @param schema
   */
  attest<T>(
    from: Hex,
    to: Hex,
    data: T,
    schema: Schema,
    captureReferences?: boolean
  ) {}

  /**
   * Replaces the schema list with a new list.
   * @param schemas
   */
  replaceSchemas(schemas: Schema[]) {
    this._schemas = schemas;
  }

  /**
   *  Replaces a schema from the schema list.
   * @throws {SchemaError} if desired schema name does not exist.
   */
  replaceSingleSchema(schema: Schema) {
    const idx = this.schemas.findIndex((item) => schema.name === item.name);
    if (!~idx)
      throw new SchemaError(
        "SCHEMA_NOT_FOUND",
        `Schema ${schema.name} not found.`
      );

    this._schemas[idx] = schema;
  }

  /**
   * Creates or returns an existing GAP client.
   *
   * _Use the constructor only if multiple clients are needed._
   * @static
   * @param {GAPArgs} args
   * @returns
   */
  static createClient(args: GAPArgs) {
    if (!this.client) this.client = new this(args);
    return this.client;
  }

  get schemas() {
    return this._schemas;
  }
}
