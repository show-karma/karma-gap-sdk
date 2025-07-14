"use strict";
/**
 * Universal contract interface for viem
 * Provides a unified way to interact with contracts using viem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContract = createContract;
exports.supportsWrites = supportsWrites;
const viem_1 = require("viem");
/**
 * Create a universal contract instance
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param provider - Viem client or ethers provider/signer
 * @returns Universal contract instance
 */
async function createContract(address, abi, provider) {
    let publicClient;
    let walletClient;
    if (provider.mode !== "publicClient") {
        walletClient = provider;
        publicClient = provider; // Wallet clients can also read
    }
    else {
        publicClient = provider;
    }
    const contractAddress = address;
    // Create the contract interface
    const contract = {
        address: contractAddress,
        abi,
        async read(functionName, args = []) {
            try {
                // Ensure args is an array and filter out undefined values
                const cleanArgs = Array.isArray(args)
                    ? args.filter((arg) => arg !== undefined)
                    : [];
                // Use viem's readContract action directly
                const result = await publicClient.readContract({
                    address: contractAddress,
                    abi,
                    functionName,
                    args: cleanArgs,
                });
                return result;
            }
            catch (error) {
                console.error("Contract read error:", {
                    functionName,
                    args,
                    error: error.message,
                    contractAddress,
                });
                throw error;
            }
        },
        async write(functionName, args = [], options = {}) {
            if (!walletClient) {
                throw new Error("Wallet client required for write operations");
            }
            const cleanArgs = Array.isArray(args)
                ? args.filter((arg) => arg !== undefined)
                : [];
            return await walletClient.writeContract({
                address: contractAddress,
                abi,
                functionName,
                args: cleanArgs,
                ...options,
            });
        },
        async estimateGas(functionName, args = []) {
            const cleanArgs = Array.isArray(args)
                ? args.filter((arg) => arg !== undefined)
                : [];
            return await publicClient.estimateContractGas({
                address: contractAddress,
                abi,
                functionName,
                args: cleanArgs,
            });
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
    if (provider?.mode === "walletClient") {
        return true;
    }
    return false;
}
