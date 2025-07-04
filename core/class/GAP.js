"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAP = void 0;
const CommunityResolverABI_json_1 = __importDefault(require("../abi/CommunityResolverABI.json"));
const MultiAttester_json_1 = __importDefault(require("../abi/MultiAttester.json"));
const ProjectResolver_json_1 = __importDefault(require("../abi/ProjectResolver.json"));
const utils_1 = require("../utils");
const package_json_1 = require("../../package.json");
const consts_1 = require("../consts");
const types_1 = require("../types");
const get_web3_provider_1 = require("../utils/get-web3-provider");
const utils_2 = require("../utils");
const GapSchema_1 = require("./GapSchema");
const GraphQL_1 = require("./GraphQL");
const Schema_1 = require("./Schema");
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
class GAP extends types_1.Facade {
    /**
     * Get the singleton instance of GAP for a specific network.
     * If no instance exists for the network, creates one with the provided args.
     * @param args Optional initialization arguments
     * @returns The singleton instance of GAP for the specified network
     */
    static getInstance(args) {
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
                // Remove emojis
                .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
                // Remove basic text emoticons
                .replace(/[:;=][()DP]/g, "")
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")
                .trim()
                .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
            const checkSlug = async (currentSlug, counter = 0) => {
                const slugToCheck = counter === 0 ? currentSlug : `${currentSlug}-${counter}`;
                const slugExists = await this.fetch.slugExists(slugToCheck);
                if (slugExists) {
                    return checkSlug(currentSlug, counter + 1);
                }
                return slugToCheck.toLowerCase();
            };
            return checkSlug(slug);
        };
        const schemas = args.schemas || Object.values((0, consts_1.MountEntities)(consts_1.Networks[args.network]));
        this.network = args.network;
        this._eas = (0, utils_1.createEASInstance)(consts_1.Networks[args.network].contracts.eas);
        this.fetch =
            args.apiClient ||
                new GraphQL_1.GapEasClient({
                    network: args.network,
                });
        this.fetch.gapInstance = this;
        this.assertGelatoOpts(args);
        this.assertZeroDevOpts(args);
        GAP._gelatoOpts = args.gelatoOpts;
        GAP._zeroDevOpts = args.zeroDevOpts;
        GAP.remoteStorage = args.remoteStorage;
        this._schemas = schemas.map((schema) => new GapSchema_1.GapSchema(schema, this, false, args.globalSchemas ? !args.globalSchemas : false));
        Schema_1.Schema.validate(this.network);
        console.info(`Loaded GAP SDK v${package_json_1.version} for network ${this.network}`);
        GAP.instances.set(this.network, this);
    }
    assertGelatoOpts(args) {
        if (args.gelatoOpts &&
            !(args.gelatoOpts.sponsorUrl || args.gelatoOpts.apiKey)) {
            throw new Error("You must provide a `sponsorUrl` or an `apiKey`.");
        }
        if (args.gelatoOpts?.sponsorUrl &&
            args.gelatoOpts?.contained &&
            !args.gelatoOpts.env_gelatoApiKey) {
            throw new Error("You must provide `env_gelatoApiKey` to be able to use it in a backend handler.");
        }
        if ((args.gelatoOpts?.env_gelatoApiKey ||
            args.gelatoOpts?.apiKey ||
            args.gelatoOpts?.sponsorUrl) &&
            !args.gelatoOpts?.useGasless) {
            console.warn("GAP::You are using gelatoOpts but not setting useGasless to true. This will send transactions through the normal provider.");
        }
    }
    assertZeroDevOpts(args) {
        if (args.gelatoOpts?.useGasless && args.zeroDevOpts?.enabled) {
            throw new Error("Cannot use both Gelato and ZeroDev for gasless transactions. Choose one.");
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
     * @param signer - Viem client or ethers provider/signer for backward compatibility
     */
    static async getMulticall(signer) {
        // Get chain ID based on provider type
        let chainId;
        // Try multiple ways to extract chain ID for different client types
        if (signer.chain?.id) {
            chainId = signer.chain.id;
        }
        else if (signer.getChainId) {
            chainId = await signer.getChainId();
        }
        else if (signer._network?.chainId) {
            chainId = signer._network.chainId;
        }
        else if (signer.network?.chainId) {
            chainId = signer.network.chainId;
        }
        else {
            console.warn("Unable to detect chain ID from signer, defaulting to 1 (mainnet)");
            chainId = 1;
        }
        console.log("🔧 GAP.getMulticall debug:", {
            chainId,
            signerType: typeof signer,
            hasChain: !!signer.chain,
            hasGetChainId: !!signer.getChainId,
        });
        const network = Object.values(consts_1.Networks).find((n) => +n.chainId === chainId);
        if (!network) {
            console.error("Available networks:", Object.entries(consts_1.Networks).map(([key, n]) => ({
                network: key,
                chainId: n.chainId,
            })));
            throw new Error(`Network ${chainId} not supported.`);
        }
        const address = network.contracts.multicall;
        console.log("🔧 Network found:", {
            chainId: network.chainId,
            contracts: Object.keys(network.contracts),
            multicallAddress: address,
        });
        if (!address) {
            throw new Error(`Multicall contract address not found for chainId ${chainId}`);
        }
        console.log("🔧 Creating contract with address:", address, "for chainId:", chainId);
        // Return UniversalContract which works with both ethers and viem
        const contract = (0, utils_2.createUniversalContract)(address, MultiAttester_json_1.default, signer);
        console.log("🔧 Contract created:", {
            address: contract.address,
            contractAddress: contract.contractAddress,
        });
        return contract;
    }
    /**
     * Get the project resolver contract
     * @param signer - Viem client or ethers provider/signer for backward compatibility
     * @param chainId - Optional chain ID
     */
    static async getProjectResolver(signer, chainId) {
        // Get chain ID if not provided
        let currentChainId;
        if (chainId) {
            currentChainId = chainId;
        }
        else if ((0, utils_2.isEthersProvider)(signer) || signer.getNetwork) {
            const network = await signer.getNetwork();
            currentChainId = Number(network.chainId);
        }
        else {
            // Viem client
            currentChainId = signer.chain?.id || 1;
        }
        // If chainId is provided and signer is ethers, use ethers provider
        // Otherwise use the provided signer
        let provider;
        if (chainId && (0, utils_2.isEthersProvider)(signer)) {
            provider = (0, get_web3_provider_1.getWeb3Provider)(chainId);
        }
        else if (chainId && !(0, utils_2.isEthersProvider)(signer)) {
            provider = (0, utils_2.getPublicClient)(chainId);
        }
        else {
            provider = signer;
        }
        const network = Object.values(consts_1.Networks).find((n) => +n.chainId === Number(currentChainId));
        if (!network)
            throw new Error(`Network ${currentChainId} not supported.`);
        const address = network.contracts.projectResolver;
        // Return UniversalContract which works with both ethers and viem
        return (0, utils_2.createUniversalContract)(address, ProjectResolver_json_1.default, provider);
    }
    /**
     * Get the community resolver contract
     * @param signer - Viem client or ethers provider/signer for backward compatibility
     * @param chainId - Optional chain ID
     */
    static async getCommunityResolver(signer, chainId) {
        // Get chain ID if not provided
        let currentChainId;
        if (chainId) {
            currentChainId = chainId;
        }
        else if ((0, utils_2.isEthersProvider)(signer) || signer.getNetwork) {
            const network = await signer.getNetwork();
            currentChainId = Number(network.chainId);
        }
        else {
            // Viem client
            currentChainId = signer.chain?.id || 1;
        }
        // If chainId is provided and signer is ethers, use ethers provider
        // Otherwise use the provided signer
        let provider;
        if (chainId && (0, utils_2.isEthersProvider)(signer)) {
            provider = (0, get_web3_provider_1.getWeb3Provider)(chainId);
        }
        else if (chainId && !(0, utils_2.isEthersProvider)(signer)) {
            provider = (0, utils_2.getPublicClient)(chainId);
        }
        else {
            provider = signer;
        }
        const network = Object.values(consts_1.Networks).find((n) => +n.chainId === Number(currentChainId));
        if (!network)
            throw new Error(`Network ${currentChainId} not supported.`);
        const address = network.contracts.communityResolver;
        return (0, utils_2.createUniversalContract)(address, CommunityResolverABI_json_1.default, provider);
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
        if (typeof this._gelatoOpts === "undefined") {
            this._gelatoOpts = gelatoOpts;
        }
        else {
            throw new Error("Cannot change a readonly value gelatoOpts.");
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
            throw new Error("You must provide a `sponsorUrl` or an `apiKey` before using gasless transactions.");
        }
        this._gelatoOpts.useGasless = useGasLess;
    }
    /**
     * ZeroDev configuration for smart account and paymaster support.
     */
    static set zeroDevOpts(zeroDevOpts) {
        if (typeof this._zeroDevOpts === "undefined" ||
            this._zeroDevOpts === null) {
            this._zeroDevOpts = zeroDevOpts;
        }
        else {
            throw new Error("Cannot change a readonly value zeroDevOpts.");
        }
    }
    /**
     * ZeroDev configuration for smart account and paymaster support.
     */
    static get zeroDevOpts() {
        return this._zeroDevOpts;
    }
    /**
     * Set whether to use ZeroDev for gasless transactions
     */
    static set enabled(enabled) {
        if (enabled) {
            console.warn("GAP::You are enabling ZeroDev but paymaster is not configured. Users may still pay gas.");
        }
        if (this._zeroDevOpts) {
            this._zeroDevOpts.enabled = enabled;
        }
    }
    static get remoteClient() {
        return this.remoteStorage;
    }
}
exports.GAP = GAP;
GAP.instances = new Map();
GAP._gelatoOpts = null;
GAP._zeroDevOpts = null;
