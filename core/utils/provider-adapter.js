"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEthersProvider = isEthersProvider;
exports.isEthersSigner = isEthersSigner;
exports.ethersProviderToViemClient = ethersProviderToViemClient;
exports.ethersSignerToViemClient = ethersSignerToViemClient;
exports.adaptEthersToViem = adaptEthersToViem;
const viem_1 = require("viem");
const viem_provider_1 = require("./viem-provider");
/**
 * Provider adapter for backward compatibility
 * Converts ethers providers to viem clients
 * This allows existing code using ethers to work with the viem-based SDK
 */
/**
 * Type guard to check if provider is an ethers provider
 */
function isEthersProvider(provider) {
    return (provider &&
        (typeof provider.getNetwork === "function" ||
            typeof provider.getSigner === "function" ||
            typeof provider._isProvider === "boolean" ||
            provider.constructor?.name?.includes("Provider")));
}
/**
 * Type guard to check if signer is an ethers signer
 */
function isEthersSigner(signer) {
    return (signer &&
        typeof signer.getAddress === "function" &&
        typeof signer.signMessage === "function" &&
        typeof signer.signTransaction === "function");
}
/**
 * Convert ethers provider to viem public client
 * @param provider - Ethers provider instance
 * @returns Viem public client
 */
async function ethersProviderToViemClient(provider) {
    try {
        // Get chain ID from ethers provider
        let chainId;
        if (typeof provider.getNetwork === "function") {
            const network = await provider.getNetwork();
            chainId = Number(network.chainId);
        }
        else if (provider._network?.chainId) {
            chainId = Number(provider._network.chainId);
        }
        else {
            // Default to mainnet if we can't determine chain
            chainId = 1;
        }
        const chain = (0, viem_provider_1.getChain)(chainId);
        // Create transport using ethers provider
        const transport = (0, viem_1.custom)({
            request: async ({ method, params }) => {
                try {
                    // Handle different ethers versions
                    if (typeof provider.send === "function") {
                        return await provider.send(method, params);
                    }
                    else if (typeof provider.request === "function") {
                        return await provider.request({ method, params });
                    }
                    else {
                        throw new Error("Unsupported ethers provider version");
                    }
                }
                catch (error) {
                    console.error("Provider request error:", error);
                    throw error;
                }
            },
        });
        // Use any to avoid deep type instantiation issues
        const client = (0, viem_1.createPublicClient)({
            chain,
            transport,
        });
        return client;
    }
    catch (error) {
        console.error("Error converting ethers provider to viem:", error);
        throw new Error(`Failed to convert ethers provider: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Convert ethers signer to viem wallet client
 * @param signer - Ethers signer instance
 * @returns Viem wallet client
 */
async function ethersSignerToViemClient(signer) {
    try {
        // Get the provider from the signer
        const provider = signer.provider;
        if (!provider) {
            throw new Error("Signer must have a provider");
        }
        // Get chain ID
        let chainId;
        if (typeof provider.getNetwork === "function") {
            const network = await provider.getNetwork();
            chainId = Number(network.chainId);
        }
        else if (provider._network?.chainId) {
            chainId = Number(provider._network.chainId);
        }
        else {
            chainId = 1; // Default to mainnet
        }
        const chain = (0, viem_provider_1.getChain)(chainId);
        // Get account address
        const address = (await signer.getAddress());
        // Create custom transport that uses the ethers signer
        const transport = (0, viem_1.custom)({
            request: async ({ method, params }) => {
                try {
                    // Special handling for signing methods
                    if (method === "eth_sendTransaction") {
                        const [tx] = params;
                        const signedTx = await signer.signTransaction(tx);
                        return await provider.send("eth_sendRawTransaction", [signedTx]);
                    }
                    if (method === "eth_signMessage" || method === "personal_sign") {
                        const [message] = params;
                        return await signer.signMessage(message);
                    }
                    if (method === "eth_accounts") {
                        return [address];
                    }
                    // For other methods, use the provider
                    if (typeof provider.send === "function") {
                        return await provider.send(method, params);
                    }
                    else if (typeof provider.request === "function") {
                        return await provider.request({ method, params });
                    }
                    else {
                        throw new Error("Unsupported provider method");
                    }
                }
                catch (error) {
                    console.error("Signer request error:", error);
                    throw error;
                }
            },
        });
        // Use any to avoid deep type instantiation issues
        const walletClient = (0, viem_1.createWalletClient)({
            account: address,
            chain,
            transport,
        });
        return walletClient;
    }
    catch (error) {
        console.error("Error converting ethers signer to viem:", error);
        throw new Error(`Failed to convert ethers signer: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Unified adapter that handles both providers and signers
 * @param providerOrSigner - Ethers provider or signer
 * @returns Viem client (public or wallet)
 */
async function adaptEthersToViem(providerOrSigner) {
    if (isEthersSigner(providerOrSigner)) {
        return ethersSignerToViemClient(providerOrSigner);
    }
    else if (isEthersProvider(providerOrSigner)) {
        return ethersProviderToViemClient(providerOrSigner);
    }
    else {
        throw new Error("Invalid provider or signer: must be an ethers provider or signer");
    }
}
