import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
  Chain,
  Account,
  Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  polygon,
  celo,
} from "viem/chains";
import { Networks } from "../consts";
import { defineChain } from "viem";

// Define custom chains for those not in viem
const sei = defineChain({
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

const seiTestnet = defineChain({
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

const lisk = defineChain({
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

const scroll = defineChain({
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
const viemChains: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  10: optimism,
  11155420: optimismSepolia,
  42161: arbitrum,
  421614: arbitrumSepolia,
  8453: base,
  84532: baseSepolia,
  137: polygon,
  42220: celo,
  1329: sei,
  1328: seiTestnet,
  1135: lisk,
  534352: scroll,
};

// Cache for public clients
const publicClients: Record<number, PublicClient> = {};

/**
 * Get or create a public client for a specific chain
 */
export function getPublicClient(chainId: number): PublicClient {
  if (!publicClients[chainId]) {
    const chain = viemChains[chainId];
    const network = Object.values(Networks).find((n) => n.chainId === chainId);

    if (!chain || !network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Create the client with a simpler approach to avoid type issues
    const client = createPublicClient({
      chain,
      transport: http(network.rpcUrl),
    });

    publicClients[chainId] = client as any;
  }

  return publicClients[chainId];
}

/**
 * Create a wallet client from a private key
 */
export function createWalletFromPrivateKey(
  privateKey: `0x${string}`,
  chainId: number
): { account: Account; walletClient: WalletClient } {
  const chain = viemChains[chainId];
  const network = Object.values(Networks).find((n) => n.chainId === chainId);

  if (!chain || !network) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(network.rpcUrl),
  }) as any;

  return { account, walletClient };
}

/**
 * Get chain configuration by ID
 */
export function getChain(chainId: number): Chain {
  const chain = viemChains[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return chain;
}

/**
 * Type exports for convenience
 */
export type {
  PublicClient,
  WalletClient,
  Chain,
  Account,
  Transport,
} from "viem";
