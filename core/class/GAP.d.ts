import { AttestArgs, Facade, SchemaInterface, TNetwork, TSchemaName, SignerOrProvider } from "../types";
import { GapSchema } from "./GapSchema";
import { GAPFetcher } from "./GraphQL/GAPFetcher";
import { ethers } from "ethers";
interface GAPArgs {
    network: TNetwork;
    globalSchemas?: boolean;
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
export declare class GAP extends Facade {
    private static client;
    readonly fetch: GAPFetcher;
    readonly network: TNetwork;
    private _schemas;
    private static _gelatoOpts;
    constructor(args: GAPArgs);
    private assert;
    /**
     * Creates the attestation payload using a specific schema.
     * @param from
     * @param to
     * @param data
     * @param schema
     */
    attest<T>(attestation: AttestArgs<T> & {
        schemaName: TSchemaName;
    }): Promise<`0x${string}`>;
    /**
     * Replaces the schema list with a new list.
     * @param schemas
     */
    replaceSchemas(schemas: GapSchema[]): void;
    /**
     *  Replaces a schema from the schema list.
     * @throws {SchemaError} if desired schema name does not exist.
     */
    replaceSingleSchema(schema: GapSchema): void;
    /**
     * Generates a slug from a text.
     * @param text
     * @returns
     */
    generateSlug: (text: string) => Promise<string>;
    /**
     * Creates or returns an existing GAP client.
     *
     * _Use the constructor only if multiple clients are needed._
     * @static
     * @param {GAPArgs} args
     * @returns
     */
    static createClient(args: GAPArgs): GAP;
    /**
     * Get the multicall contract
     * @param signer
     */
    static getMulticall(signer: SignerOrProvider): ethers.Contract;
    get schemas(): GapSchema[];
    /**
     * Defined if the transactions will be gasless or not.
     *
     * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
     * and an API key is needed.
     */
    private static set gelatoOpts(value);
    /**
     * Defined if the transactions will be gasless or not.
     *
     * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
     * and an API key is needed.
     */
    static get gelatoOpts(): GAPArgs["gelatoOpts"];
    static set useGasLess(useGasLess: boolean);
}
export {};
