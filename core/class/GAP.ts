import CommunityResolverABI from "../abi/CommunityResolverABI.json";
import MulticallABI from "../abi/MultiAttester.json";
import ProjectResolverABI from "../abi/ProjectResolver.json";

import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { createEASInstance } from "../utils";
import { version } from "../../package.json";
import { MountEntities, Networks } from "../consts";
import {
  AttestArgs,
  Facade,
  SchemaInterface,
  SignerOrProvider,
  TNetwork,
  TSchemaName,
} from "../types";
import { getWeb3Provider } from "../utils/get-web3-provider";
import {
  getPublicClient,
  createUniversalContract,
  isEthersProvider,
  type UniversalContract,
} from "../utils";
import type {
  PublicClient,
  WalletClient,
  Transport,
  Chain,
  Account,
} from "viem";
import { Fetcher } from "./Fetcher";
import { GapSchema } from "./GapSchema";
import { GapEasClient } from "./GraphQL";
import { RemoteStorage } from "./remote-storage/RemoteStorage";
import { Schema } from "./Schema";

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
  /**
   * Defines a remote storage client to be used to store data.
   * If defined, all the details data from an attestation will
   * be stored in the remote storage, e.g. IPFS.
   */
  remoteStorage?: RemoteStorage;
}

/**
 * GAP SDK Facade.
 *
 * This is the main class that is used to interact with the GAP SDK.
 *
 * This class implements the singleton pattern to ensure only one instance exists
 * throughout the application lifecycle.
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
 * // Initialize the singleton instance
 * const gap = GAP.getInstance({
 *   network: "sepolia",
 *   owner: "0xd7d1DB401EA825b0325141Cd5e6cd7C2d01825f2",
 *   schemas: Object.values(schemas),
 * });
 *
 * // Later in the code, get the same instance
 * const sameGap = GAP.getInstance();
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
  private static remoteStorage?: RemoteStorage;
  private static instances: Map<TNetwork, GAP> = new Map();

  readonly fetch: Fetcher;
  readonly network: TNetwork;

  private _schemas: GapSchema[];
  private static _gelatoOpts = null;

  /**
   * Get the singleton instance of GAP for a specific network.
   * If no instance exists for the network, creates one with the provided args.
   * @param args Optional initialization arguments
   * @returns The singleton instance of GAP for the specified network
   */
  static getInstance(args?: GAPArgs): GAP {
    if (!args) {
      throw new Error("Network must be specified when getting GAP instance");
    }

    const existingInstance = GAP.instances.get(args.network);
    if (existingInstance) {
      return existingInstance;
    }

    if (!args) {
      throw new Error("Initialization arguments required for first instance");
    }

    const newInstance = new GAP(args);
    GAP.instances.set(args.network, newInstance);
    return newInstance;
  }

  /**
   * Creates a new instance of GAP.
   * You can either use this constructor directly or use the singleton pattern via getInstance().
   * @param args Initialization arguments
   */
  constructor(args: GAPArgs) {
    super();

    const schemas =
      args.schemas || Object.values(MountEntities(Networks[args.network]));

    this.network = args.network;

    this._eas = createEASInstance(Networks[args.network].contracts.eas);

    this.fetch =
      args.apiClient ||
      new GapEasClient({
        network: args.network,
      });

    this.fetch.gapInstance = this;

    this.assertGelatoOpts(args);
    GAP._gelatoOpts = args.gelatoOpts;

    GAP.remoteStorage = args.remoteStorage;

    this._schemas = schemas.map(
      (schema) =>
        new GapSchema(
          schema,
          this,
          false,
          args.globalSchemas ? !args.globalSchemas : false
        )
    );

    Schema.validate(this.network);

    console.info(`Loaded GAP SDK v${version} for network ${this.network}`);

    GAP.instances.set(this.network, this);
  }

  private assertGelatoOpts(args: GAPArgs) {
    if (
      args.gelatoOpts &&
      !(args.gelatoOpts.sponsorUrl || args.gelatoOpts.apiKey)
    ) {
      throw new Error("You must provide a `sponsorUrl` or an `apiKey`.");
    }

    if (
      args.gelatoOpts?.sponsorUrl &&
      args.gelatoOpts?.contained &&
      !args.gelatoOpts.env_gelatoApiKey
    ) {
      throw new Error(
        "You must provide `env_gelatoApiKey` to be able to use it in a backend handler."
      );
    }

    if (
      (args.gelatoOpts?.env_gelatoApiKey ||
        args.gelatoOpts?.apiKey ||
        args.gelatoOpts?.sponsorUrl) &&
      !args.gelatoOpts?.useGasless
    ) {
      console.warn(
        "GAP::You are using gelatoOpts but not setting useGasless to true. This will send transactions through the normal provider."
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
    const schema = GapSchema.find(attestation.schemaName, this.network);
    return schema.attest(attestation);
  }

  /**
   * Replaces the schema list with a new list.
   * @param schemas
   */
  replaceSchemas(schemas: GapSchema[]) {
    Schema.replaceAll(schemas, this.network);
  }

  /**
   *  Replaces a schema from the schema list.
   * @throws {SchemaError} if desired schema name does not exist.
   */
  replaceSingleSchema(schema: GapSchema) {
    Schema.replaceOne(schema, this.network);
  }

  /**
   * Generates a slug from a text.
   * @param text
   * @returns
   */
  generateSlug = async (text: string): Promise<string> => {
    let slug = text
      .toLowerCase()
      // Remove emojis
      .replace(
        /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
        ""
      )
      // Remove basic text emoticons
      .replace(/[:;=][()DP]/g, "")
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")
      .trim()
      .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens

    const checkSlug = async (
      currentSlug: string,
      counter: number = 0
    ): Promise<string> => {
      const slugToCheck =
        counter === 0 ? currentSlug : `${currentSlug}-${counter}`;
      const slugExists = await this.fetch.slugExists(slugToCheck);

      if (slugExists) {
        return checkSlug(currentSlug, counter + 1);
      }

      return slugToCheck.toLowerCase();
    };

    return checkSlug(slug);
  };

  /**
   * Returns a copy of the original schema with no pointers.
   * @param name
   * @returns
   */
  findSchema(name: TSchemaName): GapSchema {
    const found = Schema.get<TSchemaName, GapSchema>(name, this.network);
    return GapSchema.clone(found);
  }

  /**
   * Find many schemas by name and return their copies as an array in the same order.
   * @param names
   * @returns
   */
  findManySchemas(names: TSchemaName[]): GapSchema[] {
    const schemas = Schema.getMany<TSchemaName, GapSchema>(names, this.network);
    return schemas.map((s) => GapSchema.clone(s));
  }

  /**
   * Get the multicall contract
   * @param signer - Viem client or ethers provider/signer for backward compatibility
   */
  static async getMulticall(
    signer:
      | SignerOrProvider
      | PublicClient<Transport, Chain>
      | WalletClient<Transport, Chain, Account>
  ): Promise<UniversalContract> {
    // Get chain ID based on provider type
    let chainId: number;

    chainId = (signer as any).chain?.id || 1;

    const network = Object.values(Networks).find((n) => +n.chainId === chainId);
    if (!network) throw new Error(`Network ${chainId} not supported.`);

    const address = network.contracts.multicall;

    // Return UniversalContract which works with both ethers and viem
    return createUniversalContract(address, MulticallABI as any, signer);
  }

  /**
   * Get the project resolver contract
   * @param signer - Viem client or ethers provider/signer for backward compatibility
   * @param chainId - Optional chain ID
   */
  static async getProjectResolver(
    signer:
      | SignerOrProvider
      | PublicClient<Transport, Chain>
      | WalletClient<Transport, Chain, Account>,
    chainId?: number
  ): Promise<UniversalContract> {
    // Get chain ID if not provided
    let currentChainId: number;
    if (chainId) {
      currentChainId = chainId;
    } else if (isEthersProvider(signer) || (signer as any).getNetwork) {
      const network = await (signer as any).getNetwork();
      currentChainId = Number(network.chainId);
    } else {
      // Viem client
      currentChainId = (signer as any).chain?.id || 1;
    }

    // If chainId is provided and signer is ethers, use ethers provider
    // Otherwise use the provided signer
    let provider: any;
    if (chainId && isEthersProvider(signer)) {
      provider = getWeb3Provider(chainId);
    } else if (chainId && !isEthersProvider(signer)) {
      provider = getPublicClient(chainId);
    } else {
      provider = signer;
    }

    const network = Object.values(Networks).find(
      (n) => +n.chainId === Number(currentChainId)
    );
    if (!network) throw new Error(`Network ${currentChainId} not supported.`);

    const address = network.contracts.projectResolver;

    // Return UniversalContract which works with both ethers and viem
    return createUniversalContract(
      address,
      ProjectResolverABI as any,
      provider
    );
  }

  /**
   * Get the community resolver contract
   * @param signer - Viem client or ethers provider/signer for backward compatibility
   * @param chainId - Optional chain ID
   */
  static async getCommunityResolver(
    signer:
      | SignerOrProvider
      | PublicClient<Transport, Chain>
      | WalletClient<Transport, Chain, Account>,
    chainId?: number
  ): Promise<UniversalContract> {
    // Get chain ID if not provided
    let currentChainId: number;
    if (chainId) {
      currentChainId = chainId;
    } else if (isEthersProvider(signer) || (signer as any).getNetwork) {
      const network = await (signer as any).getNetwork();
      currentChainId = Number(network.chainId);
    } else {
      // Viem client
      currentChainId = (signer as any).chain?.id || 1;
    }

    // If chainId is provided and signer is ethers, use ethers provider
    // Otherwise use the provided signer
    let provider: any;
    if (chainId && isEthersProvider(signer)) {
      provider = getWeb3Provider(chainId);
    } else if (chainId && !isEthersProvider(signer)) {
      provider = getPublicClient(chainId);
    } else {
      provider = signer;
    }

    const network = Object.values(Networks).find(
      (n) => +n.chainId === Number(currentChainId)
    );
    if (!network) throw new Error(`Network ${currentChainId} not supported.`);

    const address = network.contracts.communityResolver;

    // Return UniversalContract which works with both ethers and viem
    return createUniversalContract(
      address,
      CommunityResolverABI as any,
      provider
    );
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
  private static set gelatoOpts(gelatoOpts: GAPArgs["gelatoOpts"]) {
    if (typeof this._gelatoOpts === "undefined") {
      this._gelatoOpts = gelatoOpts;
    } else {
      throw new Error("Cannot change a readonly value gelatoOpts.");
    }
  }

  /**
   * Defined if the transactions will be gasless or not.
   *
   * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
   * and an API key is needed.
   */
  static get gelatoOpts(): GAPArgs["gelatoOpts"] {
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
        "You must provide a `sponsorUrl` or an `apiKey` before using gasless transactions."
      );
    }
    this._gelatoOpts.useGasless = useGasLess;
  }

  static get remoteClient() {
    return this.remoteStorage;
  }
}
