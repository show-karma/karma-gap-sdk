import { Networks } from "../consts";
import { EASClient } from "./GraphQL/EASClient";
import { Hex, TNetwork } from "../types";
import { Schema, SchemaInterface } from "./Schema";
import { GapSchema } from "./GapSchema";
import { EASFetcher } from "./GraphQL/EASFetcher";

interface GAPArgs {
  network: TNetwork;
  owner: Hex;
  schemas: SchemaInterface[];
}

export class GAP implements GAPArgs {
  private static client: GAP;

  readonly eas: EASClient;
  readonly fetcher: EASFetcher;
  readonly owner: Hex;
  readonly network: TNetwork;

  private _schemas: GapSchema[];

  private constructor(args: GAPArgs) {
    this.owner = args.owner;

    this.eas = new EASClient({ network: args.network, owner: args.owner });
    this.fetcher = new EASFetcher({ network: args.network, owner: args.owner });

    this._schemas = args.schemas.map((schema) => new GapSchema(schema));
    Schema.validate();
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
    schema: GapSchema,
    captureReferences?: boolean
  ) {}

  /**
   * Replaces the schema list with a new list.
   * @param schemas
   */
  replaceSchemas(schemas: GapSchema[]) {
    Schema.replaceAll(schemas);
  }

  /**
   *  Replaces a schema from the schema list.
   * @throws {SchemaError} if desired schema name does not exist.
   */
  replaceSingleSchema(schema: GapSchema) {
    Schema.replaceOne(schema);
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
