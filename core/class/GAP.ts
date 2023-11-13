import {
  AttestArgs,
  Facade,
  SchemaInterface,
  TNetwork,
  TSchemaName,
  SignerOrProvider,
} from '../types';
import { Schema } from './Schema';
import { GapSchema } from './GapSchema';
import { GapEasClient } from './GraphQL/GapEasClient';
import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { MountEntities, Networks } from '../consts';
import { ethers } from 'ethers';
import MulticallABI from '../abi/MultiAttester.json';
import { version } from '../../package.json';
import { Fetcher } from './Fetcher';

interface GAPArgs {
  network: TNetwork;
  globalSchemas?: boolean;
  /**
   * Custom API Client to be used to fetch attestation data.
   * If not defined, will use the default EAS Client and rely on EAS's GraphQL API.
   */
  apiClient?: Fetcher;
  schemas?: SchemaInterface<TSchemaName>[];
  /**
   * Defined if the transactions will be gasless or not.
   *
   * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
   * and an API key is needed.
   *
   * > __Note that to safely transact through Gelato, the user must
   * have set a handlerUrl and not expose gelato api in the frontend.__
   */
  gelatoOpts?: {
    /**
     * Endpoint in which the transaction will be sent.
     * A custom endpoint will ensure that the transaction will be sent through Gelato
     * and api keys won't be exposed in the frontend.
     *
     * __If coding a backend, you can use `apiKey` prop instead.__
     *
     * `core/utils/gelato/sponsor-handler.ts` is a base handler that can be used
     * together with NextJS API routes.
     *
     * @example
     *
     * ```ts
     * // pages/api/gelato.ts
     * import { handler as sponsorHandler } from "core/utils/gelato/sponsor-handler";
     *
     * export default const handler(req, res) => sponsorHandler(req, res, "GELATO_API_KEY_ENV_VARIABLE");
     *
     * ```
     */
    sponsorUrl?: string;
    /**
     * If true, env_gelatoApiKey will be marked as required.
     * This means that the endpoint at sponsorUrl is contained in this application.
     *
     * E.g. Next.JS api route.
     */
    contained?: boolean;
    /**
     * The env key of gelato api key that will be used in the handler.
     *
     * @example
     *
     * ```
     * // .env
     * GELATO_API_KEY=1234567890
     *
     * // sponsor-handler.ts
     *
     * export async function handler(req, res) {
     *  // ...code
     *
     *  const { env_gelatoApiKey } = GAP.gelatoOpts;
     *
     *  // Will be used to get the key from environment.
     *  const { [env_gelatoApiKey]: apiKey } = process.env;
     *
     *  // send txn
     *  // res.send(result);
     * }
     * ```
     */
    env_gelatoApiKey?: string;
    /**
     * API key to be used in the handler.
     *
     * @deprecated Use this only if you have no option of setting a backend, next/nuxt api route
     * or if this application is a backend.
     *
     * > __This will expose the api key if used in the frontend.__
     */
    apiKey?: string;
    /**
     * If true, will use gelato to send transactions.
     */
    useGasless?: boolean;
  };
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

  readonly fetch: Fetcher;
  readonly network: TNetwork;

  private _schemas: GapSchema[];
  private static _gelatoOpts = null;

  constructor(args: GAPArgs) {
    super();

    const schemas =
      args.schemas || Object.values(MountEntities(Networks[args.network]));

    this.network = args.network;

    GAP._eas = new EAS(Networks[args.network].contracts.eas);

    this.fetch = args.apiClient || new GapEasClient({ network: args.network });

    this.assert(args);
    GAP._gelatoOpts = args.gelatoOpts;

    this._schemas = schemas.map(
      (schema) =>
        new GapSchema(
          schema,
          false,
          args.globalSchemas ? !args.globalSchemas : false
        )
    );
    Schema.validate();

    console.info(`Loaded GAP SDK v${version}`);
  }

  private assert(args: GAPArgs) {
    if (
      args.gelatoOpts &&
      !(args.gelatoOpts.sponsorUrl || args.gelatoOpts.apiKey)
    ) {
      throw new Error('You must provide a `sponsorUrl` or an `apiKey`.');
    }

    if (
      args.gelatoOpts?.sponsorUrl &&
      args.gelatoOpts?.contained &&
      !args.gelatoOpts.env_gelatoApiKey
    ) {
      throw new Error(
        'You must provide `env_gelatoApiKey` to be able to use it in a backend handler.'
      );
    }

    if (
      (args.gelatoOpts?.env_gelatoApiKey ||
        args.gelatoOpts?.apiKey ||
        args.gelatoOpts?.sponsorUrl) &&
      !args.gelatoOpts?.useGasless
    ) {
      console.warn(
        'GAP::You are using gelatoOpts but not setting useGasless to true. This will send transactions through the normal provider.'
      );
    }
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
   * Generates a slug from a text.
   * @param text
   * @returns
   */
  generateSlug = async (
    text: string,
    checkDuplicate = true
  ): Promise<string> => {
    let slug = text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-');
    const slugExists = await this.fetch.slugExists(slug);

    if (slugExists && checkDuplicate) {
      const parts = slug.split('-');
      const counter = parts.pop();
      slug = /\d+/g.test(counter) ? parts.join('-') : slug;
      // eslint-disable-next-line no-param-reassign
      const nextSlug = `${slug}-${
        counter && /\d+/g.test(counter) ? +counter + 1 : 1
      }`;
      console.log({ nextSlug, counter, slug });
      return this.generateSlug(nextSlug);
    }

    return slug.toLowerCase();
  };

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
    return new ethers.Contract(address, MulticallABI, signer as any);
  }

  get schemas() {
    return this._schemas;
  }

  /**
   * Defined if the transactions will be gasless or not.
   *
   * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
   * and an API key is needed.
   */
  private static set gelatoOpts(gelatoOpts: GAPArgs['gelatoOpts']) {
    if (typeof this._gelatoOpts === 'undefined') {
      this._gelatoOpts = gelatoOpts;
    } else {
      throw new Error('Cannot change a readonly value gelatoOpts.');
    }
  }

  /**
   * Defined if the transactions will be gasless or not.
   *
   * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
   * and an API key is needed.
   */
  static get gelatoOpts(): GAPArgs['gelatoOpts'] {
    return this._gelatoOpts;
  }

  static set useGasLess(useGasLess: boolean) {
    if (
      useGasLess &&
      !this._gelatoOpts?.apiKey &&
      !this._gelatoOpts?.sponsorUrl &&
      !this._gelatoOpts?.env_gelatoApiKey
    ) {
      throw new Error(
        'You must provide a `sponsorUrl` or an `apiKey` before using gasless transactions.'
      );
    }
    this._gelatoOpts.useGasless = useGasLess;
  }
}
