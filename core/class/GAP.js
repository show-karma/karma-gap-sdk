"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAP = void 0;
const MultiAttester_json_1 = __importDefault(require("../abi/MultiAttester.json"));
const ProjectResolver_json_1 = __importDefault(require("../abi/ProjectResolver.json"));
const types_1 = require("../types");
const Schema_1 = require("./Schema");
const GapSchema_1 = require("./GapSchema");
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
const consts_1 = require("../consts");
const ethers_1 = require("ethers");
const package_json_1 = require("../../package.json");
const GraphQL_1 = require("./GraphQL");
const get_web3_provider_1 = require("../utils/get-web3-provider");
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
 * const gap = new GAP({
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
class GAP extends types_1.Facade {
    constructor(args) {
        super();
        /**
         * Generates a slug from a text.
         * @param text
         * @returns
         */
        this.generateSlug = async (text) => {
            let slug = text
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');
            const slugExists = await this.fetch.slugExists(slug);
            if (slugExists) {
                const parts = slug.split('-');
                const counter = parts.pop();
                slug = /\d+/g.test(counter) ? parts.join('-') : slug;
                // eslint-disable-next-line no-param-reassign
                const nextSlug = `${slug}-${counter && /\d+/g.test(counter) ? +counter + 1 : 1}`;
                console.log({ nextSlug, counter, slug });
                return this.generateSlug(nextSlug);
            }
            return slug.toLowerCase();
        };
        const schemas = args.schemas || Object.values((0, consts_1.MountEntities)(consts_1.Networks[args.network]));
        this.network = args.network;
        this._eas = new eas_sdk_1.EAS(consts_1.Networks[args.network].contracts.eas);
        this.fetch =
            args.apiClient ||
                new GraphQL_1.GapEasClient({
                    network: args.network,
                });
        this.fetch.gapInstance = this;
        this.assertGelatoOpts(args);
        GAP._gelatoOpts = args.gelatoOpts;
        GAP.remoteStorage = args.remoteStorage;
        this._schemas = schemas.map((schema) => new GapSchema_1.GapSchema(schema, this, false, args.globalSchemas ? !args.globalSchemas : false));
        Schema_1.Schema.validate(this.network);
        console.info(`Loaded GAP SDK v${package_json_1.version} for network ${this.network}`);
    }
    assertGelatoOpts(args) {
        if (args.gelatoOpts &&
            !(args.gelatoOpts.sponsorUrl || args.gelatoOpts.apiKey)) {
            throw new Error('You must provide a `sponsorUrl` or an `apiKey`.');
        }
        if (args.gelatoOpts?.sponsorUrl &&
            args.gelatoOpts?.contained &&
            !args.gelatoOpts.env_gelatoApiKey) {
            throw new Error('You must provide `env_gelatoApiKey` to be able to use it in a backend handler.');
        }
        if ((args.gelatoOpts?.env_gelatoApiKey ||
            args.gelatoOpts?.apiKey ||
            args.gelatoOpts?.sponsorUrl) &&
            !args.gelatoOpts?.useGasless) {
            console.warn('GAP::You are using gelatoOpts but not setting useGasless to true. This will send transactions through the normal provider.');
        }
    }
    /**
     * Creates the attestation payload using a specific schema.
     * @param from
     * @param to
     * @param data
     * @param schema
     */
    async attest(attestation) {
        const schema = GapSchema_1.GapSchema.find(attestation.schemaName, this.network);
        return schema.attest(attestation);
    }
    /**
     * Replaces the schema list with a new list.
     * @param schemas
     */
    replaceSchemas(schemas) {
        Schema_1.Schema.replaceAll(schemas, this.network);
    }
    /**
     *  Replaces a schema from the schema list.
     * @throws {SchemaError} if desired schema name does not exist.
     */
    replaceSingleSchema(schema) {
        Schema_1.Schema.replaceOne(schema, this.network);
    }
    /**
     * Returns a copy of the original schema with no pointers.
     * @param name
     * @returns
     */
    findSchema(name) {
        const found = Schema_1.Schema.get(name, this.network);
        return GapSchema_1.GapSchema.clone(found);
    }
    /**
     * Find many schemas by name and return their copies as an array in the same order.
     * @param names
     * @returns
     */
    findManySchemas(names) {
        const schemas = Schema_1.Schema.getMany(names, this.network);
        return schemas.map((s) => GapSchema_1.GapSchema.clone(s));
    }
    /**
     * Get the multicall contract
     * @param signer
     */
    static async getMulticall(signer) {
        const chain = (await signer.provider.getNetwork()) || signer.provider.network;
        const network = Object.values(consts_1.Networks).find((n) => +n.chainId === Number(chain.chainId));
        if (!network)
            throw new Error(`Network ${chain.name || chain.chainId} not supported.`);
        const address = network.contracts.multicall;
        return new ethers_1.ethers.Contract(address, MultiAttester_json_1.default, signer);
    }
    /**
     * Get the multicall contract
     * @param signer
     */
    static getProjectResolver(signer, chainId) {
        const provider = chainId ? (0, get_web3_provider_1.getWeb3Provider)(chainId) : signer;
        const network = Object.values(consts_1.Networks).find((n) => +n.chainId === Number(chainId));
        const address = network.contracts.projectResolver;
        return new ethers_1.ethers.Contract(address, ProjectResolver_json_1.default, provider);
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
    static set gelatoOpts(gelatoOpts) {
        if (typeof this._gelatoOpts === 'undefined') {
            this._gelatoOpts = gelatoOpts;
        }
        else {
            throw new Error('Cannot change a readonly value gelatoOpts.');
        }
    }
    /**
     * Defined if the transactions will be gasless or not.
     *
     * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
     * and an API key is needed.
     */
    static get gelatoOpts() {
        return this._gelatoOpts;
    }
    static set useGasLess(useGasLess) {
        if (useGasLess &&
            !this._gelatoOpts?.apiKey &&
            !this._gelatoOpts?.sponsorUrl &&
            !this._gelatoOpts?.env_gelatoApiKey) {
            throw new Error('You must provide a `sponsorUrl` or an `apiKey` before using gasless transactions.');
        }
        this._gelatoOpts.useGasless = useGasLess;
    }
    static get remoteClient() {
        return this.remoteStorage;
    }
}
exports.GAP = GAP;
GAP._gelatoOpts = null;
