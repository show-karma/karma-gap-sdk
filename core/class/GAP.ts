import { EASClient } from "./GraphQL/EASClient";
import { Facade, Hex, TNetwork } from "../types";
import { Schema, SchemaInterface } from "./Schema";
import { GapSchema } from "./GapSchema";
import { GAPFetcher } from "./GraphQL/GAPFetcher";

interface GAPArgs {
  network: TNetwork;
  owner: Hex;
  schemas: SchemaInterface[];
}

/**
 * GAP SDK Facade.
 *
 * This is the main class that is used to interact with the GAP SDK.
 *
 * This class can behave as a singleton or as a regular class.
 *
 * Using this class, the user will be able to:
 *
 * - Create and manage attestations
 * - Create and manage schemas
 * - Fetch data from the EAS
 *
 * #### Features
 *  - EAS Client: used to interact with EAS contracts
 *  - EAS Fetcher: used to fetch data from the EAS GraphQL API, providing methods for:
 *    - Get projects
 *    - Get grants with its details
 *    - Get grantees
 *    - Get members
 *    - Get tags
 *    - Get external links
 *    - Get schemas
 *    - Get attestations by pair, attester, recipient, schema, or UID
 *    - Get dependent attestations
 * - Schema: used to create and manage schemas
 * - Attestation: used to create and manage attestations
 * - Replace schemas: used to replace the schema list with a new list
 * - Replace single schema: used to replace a single schema from the schema list
 *
 * ---
 * @example
 * ```ts
 * import { GAP } from "./core/class/GAP";
 * import { GapSchema } from "./core/class/GapSchema";
 * import { Schema } from "./core/class/Schema";
 * import { MountEntities, Networks } from "./core/consts";
 *
 * const schemas = MountEntities(Networks.sepolia);
 *
 * // Use GAP.createClient to create a singleton GAP client
 * const gap = GAP.createClient({
 *   network: "sepolia",
 *   owner: "0xd7d1DB401EA825b0325141Cd5e6cd7C2d01825f2",
 *   schemas: Object.values(schemas),
 * });
 *
 * gap.fetcher
 *   .fetchProjects()
 *   .then((res) => {
 *     console.log(JSON.stringify(res, null, 2));
 *   })
 *
 * ```
 */
export class GAP extends Facade {
  private static client: GAP;

  readonly eas: EASClient;
  readonly fetch: GAPFetcher;
  readonly owner: Hex;
  readonly network: TNetwork;

  private _schemas: GapSchema[];

  private constructor(args: GAPArgs) {
    super();
    this.owner = args.owner;

    this.eas = new EASClient({ network: args.network, owner: args.owner });
    this.fetch = new GAPFetcher({ network: args.network, owner: args.owner });

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
