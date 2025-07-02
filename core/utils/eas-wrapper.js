"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEASInstance = createEASInstance;
exports.connectEAS = connectEAS;
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
const provider_adapter_1 = require("./provider-adapter");
const compatibility_1 = require("./compatibility");
/**
 * Creates an EAS instance that's compatible with both ethers and viem
 *
 * Since EAS SDK only supports ethers, we need to wrap viem clients
 * to make them compatible with EAS.
 */
function createEASInstance(contractAddress) {
    return new eas_sdk_1.EAS(contractAddress);
}
/**
 * Connects a signer/provider to an EAS instance
 *
 * If the signer is a viem client, it wraps it in an ethers-compatible adapter.
 * If it's already an ethers signer, it connects directly.
 */
function connectEAS(eas, signerOrProvider) {
    // If it's already an ethers wallet/provider, connect directly
    if ((0, provider_adapter_1.isEthersSigner)(signerOrProvider) || signerOrProvider.provider) {
        return eas.connect(signerOrProvider);
    }
    // If it's a viem client, we need to create an ethers-compatible wrapper
    if ((0, compatibility_1.isWalletClient)(signerOrProvider)) {
        // Create an ethers provider that wraps the viem client
        const provider = createEthersProviderFromViem(signerOrProvider);
        return eas.connect(provider);
    }
    // For other cases, try direct connection
    return eas.connect(signerOrProvider);
}
/**
 * Creates an ethers-compatible provider from a viem wallet client
 *
 * This is a workaround to use viem with the EAS SDK which only supports ethers.
 * It creates a minimal ethers provider that delegates calls to the viem client.
 */
function createEthersProviderFromViem(viemClient) {
    // Create a custom provider that wraps viem client
    const provider = {
        async getNetwork() {
            return {
                chainId: viemClient.chain?.id || 1,
                name: viemClient.chain?.name || "unknown",
            };
        },
        async getBlockNumber() {
            return viemClient.getBlockNumber();
        },
        async getTransactionReceipt(hash) {
            return viemClient.getTransactionReceipt({ hash });
        },
        async getBlock(blockNumber) {
            return viemClient.getBlock({ blockNumber });
        },
        async getTransaction(hash) {
            return viemClient.getTransaction({ hash });
        },
        async estimateGas(transaction) {
            return viemClient.estimateGas(transaction);
        },
        async getGasPrice() {
            return viemClient.getGasPrice();
        },
        async getFeeData() {
            const gasPrice = await viemClient.getGasPrice();
            return {
                gasPrice,
                maxFeePerGas: gasPrice,
                maxPriorityFeePerGas: gasPrice / 10n,
            };
        },
        async sendTransaction(transaction) {
            const hash = await viemClient.sendTransaction(transaction);
            return {
                hash,
                wait: () => viemClient.waitForTransactionReceipt({ hash }),
            };
        },
    };
    // Create a minimal signer that delegates to viem
    const signer = {
        provider,
        async getAddress() {
            return viemClient.account?.address || viemClient.address;
        },
        async signMessage(message) {
            return viemClient.signMessage({ message });
        },
        async signTransaction(transaction) {
            // Viem doesn't have a direct signTransaction method
            // This would need to be implemented based on your needs
            throw new Error("signTransaction not implemented for viem adapter");
        },
        async sendTransaction(transaction) {
            const hash = await viemClient.sendTransaction(transaction);
            return {
                hash,
                wait: async () => {
                    const receipt = await viemClient.waitForTransactionReceipt({ hash });
                    return receipt;
                },
            };
        },
        async _signTypedData(domain, types, value) {
            return viemClient.signTypedData({
                account: viemClient.account,
                domain,
                types,
                primaryType: Object.keys(types)[0], // Assuming first type is primary
                message: value,
            });
        },
        connect(provider) {
            return this;
        },
    };
    // Merge provider methods into signer for compatibility
    return Object.assign(signer, provider);
}
