import {
  AttestArgs,
  Facade,
  SchemaInterface,
  TNetwork,
  TSchemaName,
} from "../types";
import { Schema } from "./Schema";
import { GapSchema } from "./GapSchema";
import { GAPFetcher } from "./GraphQL/GAPFetcher";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { MountEntities, Networks } from "../consts";
import { Wallet, ethers } from "ethers";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import Multicall from "../abi/MultiAttester.json";

interface GAPArgs {
  network: TNetwork;
  schemas?: SchemaInterface<TSchemaName>[];
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

  readonly fetch: GAPFetcher;
  readonly network: TNetwork;

  private _schemas: GapSchema[];

  constructor(args: GAPArgs) {
    super();

    const schemas =
      args.schemas || Object.values(MountEntities(Networks[args.network]));

    this.network = args.network;

    GAP._eas = new EAS(Networks[args.network].contracts.eas);

    this.fetch = new GAPFetcher({ network: args.network });

    this._schemas = schemas.map((schema) => new GapSchema(schema));
    Schema.validate();
  }

  /**
   * Creates the attestation payload using a specific schema.
   * @param from
   * @param to
   * @param data
   * @param schema
   */
  async attest<T>(attestation: AttestArgs<T> & { schemaName: TSchemaName }) {
    const schema = GapSchema.find(attestation.schemaName);
    return schema.attest(attestation);
  }

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

  /**
   * Get the multicall contract
   * @param signer
   */
  static getMulticall(signer: SignerOrProvider) {
    const address = Networks[this.client.network].contracts.multicall;
    return new ethers.Contract(address, Multicall.abi, signer as any);
  }

  get schemas() {
    return this._schemas;
  }
}
