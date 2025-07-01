"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalContract = void 0;
const viem_1 = require("viem");
const ethers_1 = require("ethers");
const provider_adapter_1 = require("./provider-adapter");
/**
 * Universal contract interface that works with both ethers and viem
 */
class UniversalContract {
    constructor(address, abi, signerOrProvider) {
        this.address = address;
        this.abi = abi;
        if ((0, provider_adapter_1.isEthersProvider)(signerOrProvider) || signerOrProvider?.provider) {
            // Ethers provider or signer
            this.ethersContract = new ethers_1.Contract(address, abi, signerOrProvider);
        }
        else if ((0, provider_adapter_1.isViemPublicClient)(signerOrProvider) ||
            (0, provider_adapter_1.isViemWalletClient)(signerOrProvider)) {
            // Viem client
            this.viemContract = (0, viem_1.getContract)({
                address: this.address,
                abi: this.abi,
                client: signerOrProvider,
            });
        }
        else {
            throw new Error("Unsupported provider/signer type");
        }
    }
    /**
     * Call a read-only function
     */
    async read(functionName, args = []) {
        if (this.ethersContract) {
            return this.ethersContract[functionName](...args);
        }
        if (this.viemContract) {
            return this.viemContract.read[functionName](args);
        }
        throw new Error("No contract instance available");
    }
    /**
     * Call a write function
     */
    async write(functionName, args = [], options = {}) {
        if (this.ethersContract) {
            const tx = await this.ethersContract[functionName](...args, options);
            return tx.hash;
        }
        if (this.viemContract) {
            return this.viemContract.write[functionName](args, options);
        }
        throw new Error("No contract instance available");
    }
    /**
     * Estimate gas for a function call
     */
    async estimateGas(functionName, args = [], options = {}) {
        if (this.ethersContract) {
            const estimate = await this.ethersContract[functionName].estimateGas(...args, options);
            return BigInt(estimate.toString());
        }
        if (this.viemContract) {
            return this.viemContract.estimateGas[functionName](args, options);
        }
        throw new Error("No contract instance available");
    }
    /**
     * Encode function data
     */
    encodeFunctionData(functionName, args = []) {
        return (0, viem_1.encodeFunctionData)({
            abi: this.abi,
            functionName,
            args,
        });
    }
    /**
     * Decode function result
     */
    decodeFunctionResult(functionName, data) {
        return (0, viem_1.decodeFunctionResult)({
            abi: this.abi,
            functionName,
            data,
        });
    }
    /**
     * Get the contract address
     */
    get contractAddress() {
        return this.address;
    }
    /**
     * Check if using ethers
     */
    get isEthers() {
        return !!this.ethersContract;
    }
    /**
     * Check if using viem
     */
    get isViem() {
        return !!this.viemContract;
    }
}
exports.UniversalContract = UniversalContract;
