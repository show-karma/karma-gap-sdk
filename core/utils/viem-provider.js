"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicClient = getPublicClient;
exports.createWalletFromPrivateKey = createWalletFromPrivateKey;
exports.getChain = getChain;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const consts_1 = require("../consts");
const viem_2 = require("viem");
// Define custom chains for those not in viem
const sei = (0, viem_2.defineChain)({
    id: 1329,
    name: "Sei",
    network: "sei",
    nativeCurrency: {
        name: "SEI",
        symbol: "SEI",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [
                "https://muddy-orbital-arrow.sei-pacific.quiknode.pro/594552c3ab4ed4106b40402c16dba137ab279d40",
            ],
        },
        public: {
            http: [
                "https://muddy-orbital-arrow.sei-pacific.quiknode.pro/594552c3ab4ed4106b40402c16dba137ab279d40",
            ],
        },
    },
    blockExplorers: {
        default: { name: "SeiExplorer", url: "https://seitrace.com" },
    },
});
const seiTestnet = (0, viem_2.defineChain)({
    id: 1328,
    name: "Sei Testnet",
    network: "sei-testnet",
    nativeCurrency: {
        name: "SEI",
        symbol: "SEI",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://evm-rpc-testnet.sei-apis.com"] },
        public: { http: ["https://evm-rpc-testnet.sei-apis.com"] },
    },
    blockExplorers: {
        default: { name: "SeiExplorer", url: "https://seitrace.com" },
    },
    testnet: true,
});
const lisk = (0, viem_2.defineChain)({
    id: 1135,
    name: "Lisk",
    network: "lisk",
    nativeCurrency: {
        name: "LSK",
        symbol: "LSK",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://lisk.drpc.org"] },
        public: { http: ["https://lisk.drpc.org"] },
    },
    blockExplorers: {
        default: { name: "Lisk Explorer", url: "https://explorer.lisk.com" },
    },
});
const scroll = (0, viem_2.defineChain)({
    id: 534352,
    name: "Scroll",
    network: "scroll",
    nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://rpc.scroll.io"] },
        public: { http: ["https://rpc.scroll.io"] },
    },
    blockExplorers: {
        default: { name: "ScrollScan", url: "https://scrollscan.com" },
    },
});
// Map of chain IDs to viem chain configurations
const viemChains = {
    1: chains_1.mainnet,
    11155111: chains_1.sepolia,
    10: chains_1.optimism,
    11155420: chains_1.optimismSepolia,
    42161: chains_1.arbitrum,
    421614: chains_1.arbitrumSepolia,
    8453: chains_1.base,
    84532: chains_1.baseSepolia,
    137: chains_1.polygon,
    42220: chains_1.celo,
    1329: sei,
    1328: seiTestnet,
    1135: lisk,
    534352: scroll,
};
// Cache for public clients
const publicClients = {};
/**
 * Get or create a public client for a specific chain
 */
function getPublicClient(chainId) {
    if (!publicClients[chainId]) {
        const chain = viemChains[chainId];
        const network = Object.values(consts_1.Networks).find((n) => n.chainId === chainId);
        if (!chain || !network) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }
        // Create the client with a simpler approach to avoid type issues
        const client = (0, viem_1.createPublicClient)({
            chain,
            transport: (0, viem_1.http)(network.rpcUrl),
        });
        publicClients[chainId] = client;
    }
    return publicClients[chainId];
}
/**
 * Create a wallet client from a private key
 */
function createWalletFromPrivateKey(privateKey, chainId) {
    const chain = viemChains[chainId];
    const network = Object.values(consts_1.Networks).find((n) => n.chainId === chainId);
    if (!chain || !network) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain,
        transport: (0, viem_1.http)(network.rpcUrl),
    });
    return { account, walletClient };
}
/**
 * Get chain configuration by ID
 */
function getChain(chainId) {
    const chain = viemChains[chainId];
    if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return chain;
}
