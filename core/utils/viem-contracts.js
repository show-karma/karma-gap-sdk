"use strict";
/**
 * Universal contract interface for viem
 * Provides a unified way to interact with contracts using viem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUniversalContract = createUniversalContract;
exports.supportsWrites = supportsWrites;
const viem_1 = require("viem");
const provider_adapter_1 = require("./provider-adapter");
/**
 * Create a universal contract instance
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param provider - Viem client or ethers provider/signer
 * @returns Universal contract instance
 */
async function createUniversalContract(address, abi, provider) {
    let publicClient;
    let walletClient;
    // Handle ethers providers/signers
    if ((0, provider_adapter_1.isEthersProvider)(provider) || (0, provider_adapter_1.isEthersSigner)(provider)) {
        const viemClient = await (0, provider_adapter_1.adaptEthersToViem)(provider);
        if ("mode" in viemClient && viemClient.mode === "walletClient") {
            walletClient = viemClient;
            publicClient = viemClient; // Wallet clients can also read
        }
        else {
            publicClient = viemClient;
        }
    }
    else {
        // Already viem clients
        if (provider.mode === "walletClient") {
            walletClient = provider;
            publicClient = provider; // Wallet clients can also read
        }
        else {
            publicClient = provider;
        }
    }
    const contractAddress = address;
    // Create viem contract instances
    const readContract = (0, viem_1.getContract)({
        address: contractAddress,
        abi,
        client: publicClient,
    });
    const writeContract = walletClient
        ? (0, viem_1.getContract)({
            address: contractAddress,
            abi,
            client: walletClient,
        })
        : null;
    // Create the contract interface
    const contract = {
        address: contractAddress,
        abi,
        async read(functionName, args = []) {
            return readContract.read[functionName](...args);
        },
        async write(functionName, args = [], options = {}) {
            if (!writeContract) {
                throw new Error("Wallet client required for write operations");
            }
            return writeContract.write[functionName](...args, options);
        },
        async estimateGas(functionName, args = []) {
            return readContract.estimateGas[functionName](...args);
        },
        encodeFunctionData(functionName, args = []) {
            return (0, viem_1.encodeFunctionData)({
                abi,
                functionName,
                args,
            });
        },
        decodeFunctionResult(functionName, data) {
            return (0, viem_1.decodeFunctionResult)({
                abi,
                functionName,
                data,
            });
        },
    };
    return contract;
}
/**
 * Helper to check if a provider supports write operations
 */
function supportsWrites(provider) {
    if ((0, provider_adapter_1.isEthersSigner)(provider)) {
        return true;
    }
    if (provider?.mode === "walletClient") {
        return true;
    }
    return false;
}
