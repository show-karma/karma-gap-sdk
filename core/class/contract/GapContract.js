"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapContract = void 0;
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
const unified_types_1 = require("../../utils/unified-types");
const send_gelato_txn_1 = require("../../utils/gelato/send-gelato-txn");
const serialize_bigint_1 = require("../../utils/serialize-bigint");
const utils_1 = require("../../utils");
const GAP_1 = require("../GAP");
const kernel_1 = require("../../../utils/kernel");
// Zero bytes32 constant for properly formatted empty UIDs
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const AttestationDataTypes = {
    Attest: [
        { name: "payloadHash", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
    ],
};
class GapContract {
    /**
     * Signs a message for the delegated attestation.
     * Supports both ethers and viem signers.
     * @param signer
     * @param payload
     * @returns r,s,v signature
     */
    static async signAttestation(signer, payload, expiry) {
        let { nonce } = await this.getNonce(signer);
        const contract = await GAP_1.GAP.getMulticall(signer);
        const contractAddress = contract.address || contract.contractAddress;
        // Get chain ID based on signer type
        let chainId;
        if ((0, utils_1.isEthersSigner)(signer)) {
            const network = await signer.provider.getNetwork();
            chainId = BigInt(network.chainId);
        }
        else if ((0, utils_1.isWalletClient)(signer)) {
            chainId = BigInt(signer.chain?.id || 1);
        }
        else {
            // Fallback for providers
            const { chainId: id } = await signer.provider.getNetwork();
            chainId = BigInt(id);
        }
        const domain = {
            chainId,
            name: "gap-attestation",
            version: "1",
            verifyingContract: contractAddress,
        };
        const data = { payloadHash: payload, nonce, expiry };
        console.log({ domain, AttestationDataTypes, data });
        let signature;
        if ((0, utils_1.isEthersSigner)(signer)) {
            signature = await signer._signTypedData(domain, AttestationDataTypes, data);
        }
        else if ((0, utils_1.isWalletClient)(signer)) {
            const walletClient = signer;
            signature = await walletClient.signTypedData({
                account: walletClient.account,
                domain: domain,
                types: AttestationDataTypes,
                primaryType: "Attest",
                message: data,
            });
        }
        else {
            throw new Error("Unsupported signer type for signing");
        }
        const { r, s, v } = this.getRSV(signature);
        return { r, s, v, nonce, chainId };
    }
    /**
     * Returns the r, s, v values of a signature
     * @param signature
     * @returns
     */
    static getRSV(signature) {
        const r = signature.slice(0, 66);
        const s = `0x${signature.slice(66, 130)}`;
        const v = `0x${signature.slice(130, 132)}`;
        return { r, s, v };
    }
    static async getSignerAddress(signer) {
        if ((0, utils_1.isEthersSigner)(signer)) {
            return (await signer.getAddress());
        }
        else if ((0, utils_1.isWalletClient)(signer)) {
            const walletClient = signer;
            return walletClient.account?.address;
        }
        else {
            throw new Error("Unsupported signer type");
        }
    }
    /**
     * Get nonce for the transaction
     * @param address
     * @returns
     */
    static async getNonce(signer) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        const address = await this.getSignerAddress(signer);
        console.log({ address });
        let nonce;
        // UniversalContract
        nonce = (await contract.read("nonces", [address]));
        return {
            nonce: Number(nonce),
            next: Number(nonce + 1n),
        };
    }
    /**
     * Send a single attestation
     * @param signer
     * @param payload
     * @returns
     */
    static async attest(signer, payload, callback) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        // Check if we should use ZeroDev paymaster instead of Gelato
        if (GAP_1.GAP.zeroDevOpts?.enabled &&
            (0, utils_1.isKernelClient)(signer) &&
            (0, utils_1.supportsPaymaster)(signer)) {
            return this.attestWithPaymaster(signer, payload, callback);
        }
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.attestBySig(signer, payload);
        }
        callback?.("preparing");
        let tx;
        let result;
        const txHash = await contract.write("attest", [
            {
                schema: payload.schema,
                data: payload.data.payload,
            },
        ]);
        callback?.("pending");
        const walletClient = signer;
        const { createPublicClient, http } = await Promise.resolve().then(() => __importStar(require("viem")));
        const publicClient = createPublicClient({
            chain: walletClient.chain,
            transport: http(walletClient.transport.url ||
                walletClient.transport.url_ ||
                walletClient.transport._url),
        });
        result = await publicClient.waitForTransactionReceipt({ hash: txHash });
        callback?.("confirmed");
        const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result)[0];
        return {
            tx: [(0, unified_types_1.createTransaction)(txHash)],
            uids: [attestations],
        };
    }
    /**
     * Send a single attestation using ZeroDev paymaster
     * @param signer
     * @param payload
     * @returns
     */
    static async attestWithPaymaster(signer, payload, callback) {
        callback?.("preparing");
        const contract = await GAP_1.GAP.getMulticall(signer);
        const kernelClient = signer; // KernelClient extends WalletClient
        try {
            const attestationData = {
                ...payload.data.payload,
                refUID: payload.data.payload.refUID || ZERO_BYTES32,
            };
            const txHash = await kernelClient.writeContract({
                account: kernelClient.account,
                chain: kernelClient.chain,
                address: contract.address,
                abi: contract.abi,
                functionName: "attest",
                args: [
                    {
                        schema: payload.schema,
                        data: attestationData,
                    },
                ],
            });
            callback?.("pending");
            const provider = (await (0, kernel_1.kernelToEthersSigner)(kernelClient)).provider;
            const result = await provider.waitForTransaction(txHash);
            callback?.("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result)[0];
            return {
                tx: [(0, unified_types_1.createTransaction)(txHash)],
                uids: [attestations],
            };
        }
        catch (error) {
            console.error("ZeroDev paymaster transaction failed:", error);
            throw error;
        }
    }
    static async attestBySig(signer, payload) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)({
            schema: payload.schema,
            data: payload.data.raw,
        });
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        let populatedTxn;
        let contractAddress;
        if (contract.encodeFunctionData) {
            // UniversalContract
            populatedTxn = contract.encodeFunctionData("attestBySig", [
                {
                    data: payload.data.payload,
                    schema: payload.schema,
                },
                payloadHash,
                address,
                nonce,
                expiry,
                v,
                r,
                s,
            ]);
            contractAddress = contract.contractAddress;
        }
        else {
            // ethers Contract
            const tx = await contract.attestBySig.populateTransaction({
                data: payload.data.payload,
                schema: payload.schema,
            }, payloadHash, address, nonce, expiry, v, r, s);
            populatedTxn = tx.data;
            contractAddress = await contract.getAddress();
        }
        if (!populatedTxn)
            throw new Error("Transaction data is empty");
        const txn = await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contractAddress));
        const attestations = await this.getTransactionLogs(signer, txn);
        return {
            tx: [(0, unified_types_1.createTransaction)(txn)],
            uids: attestations,
        };
    }
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiAttest(signer, payload, callback) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        // Check if we should use ZeroDev paymaster instead of Gelato
        if (GAP_1.GAP.zeroDevOpts?.enabled &&
            (0, utils_1.isKernelClient)(signer) &&
            (0, utils_1.supportsPaymaster)(signer)) {
            return this.multiAttestWithPaymaster(signer, payload, callback);
        }
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.multiAttestBySig(signer, payload);
        }
        if (callback)
            callback("preparing");
        let result;
        const mappedPayload = payload.map((p) => ({
            uid: p.payload.uid,
            refIdx: Number(p.payload.refIdx),
            multiRequest: p.payload.multiRequest,
        }));
        const txHash = await contract.write("multiSequentialAttest", [
            mappedPayload,
        ]);
        if (callback)
            callback("pending");
        const walletClient = signer;
        try {
            const { createPublicClient, http } = await Promise.resolve().then(() => __importStar(require("viem")));
            const publicClient = createPublicClient({
                chain: walletClient.chain,
                transport: http(walletClient.transport.url ||
                    walletClient.transport.url_ ||
                    walletClient.transport._url),
            });
            result = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });
        }
        catch (error) {
            console.warn("Public client approach failed, using basic wait:", error.message);
            // Simple wait and poll approach
            await new Promise((resolve) => setTimeout(resolve, 3000));
            result = await walletClient.getTransactionReceipt({ hash: txHash });
        }
        if (callback)
            callback("confirmed");
        const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result);
        return {
            tx: [(0, unified_types_1.createTransaction)(txHash)],
            uids: attestations,
        };
    }
    /**
     * Performs a referenced multi attestation using ZeroDev paymaster.
     * Uses smart account capabilities for gasless transactions.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiAttestWithPaymaster(signer, payload, callback) {
        if (callback)
            callback("preparing");
        const contract = await GAP_1.GAP.getMulticall(signer);
        const kernelClient = signer; // KernelClient extends WalletClient
        // Ensure extremely clean payload formatting for ZeroDev/viem compatibility
        const mappedPayload = payload.map((p) => {
            // Extract and validate each field explicitly
            const uid = p.payload.uid && p.payload.uid !== "0x" ? p.payload.uid : ZERO_BYTES32;
            const refIdx = typeof p.payload.refIdx === "number" ? p.payload.refIdx : 0;
            const schema = p.payload.multiRequest.schema;
            // Process data array with extreme care for type conversion
            const data = p.payload.multiRequest.data.map((item) => {
                // Extract each field explicitly to avoid any object reference issues
                const recipient = String(item.recipient);
                const expirationTime = typeof item.expirationTime === "bigint"
                    ? item.expirationTime
                    : BigInt(item.expirationTime || 0);
                const revocable = Boolean(item.revocable);
                const refUID = item.refUID && item.refUID !== "0x"
                    ? String(item.refUID)
                    : ZERO_BYTES32;
                const dataField = String(item.data);
                const value = typeof item.value === "bigint" ? item.value : BigInt(item.value || 0);
                // Return a completely clean object
                return {
                    recipient: recipient,
                    expirationTime: expirationTime,
                    revocable: revocable,
                    refUID: refUID,
                    data: dataField,
                    value: value,
                };
            });
            // Return a completely clean payload object
            return {
                uid: uid,
                refIdx: refIdx,
                multiRequest: {
                    schema: schema,
                    data: data,
                },
            };
        });
        try {
            // Use ZeroDev's writeContract with paymaster for gasless transactions
            const txHash = await kernelClient.writeContract({
                account: kernelClient.account,
                chain: kernelClient.chain,
                address: contract.address,
                abi: contract.abi,
                functionName: "multiSequentialAttest",
                args: [mappedPayload],
                // ZeroDev paymaster will automatically sponsor gas if configured
            });
            if (callback)
                callback("pending");
            // Wait for transaction receipt using KernelClient's built-in method
            const provider = (await (0, kernel_1.kernelToEthersSigner)(kernelClient)).provider;
            const result = await provider.waitForTransaction(txHash);
            if (callback)
                callback("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result);
            return {
                tx: [(0, unified_types_1.createTransaction)(txHash)],
                uids: attestations,
            };
        }
        catch (error) {
            console.error("ZeroDev paymaster transaction failed:", error);
            console.error("Payload that caused the error:", JSON.stringify(mappedPayload, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value, 2));
            throw error;
        }
    }
    /**
     * Performs a referenced multi attestation by signature.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiAttestBySig(signer, payload) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)(payload.map((p) => p.raw));
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        console.info({ r, s, v, nonce, chainId, payloadHash, address });
        let populatedTxn;
        let contractAddress;
        if (contract.encodeFunctionData) {
            // UniversalContract
            const mappedPayload = payload.map((p) => ({
                uid: p.payload.uid,
                refIdx: Number(p.payload.refIdx), // Ensure refIdx is a number, not BigInt
                multiRequest: p.payload.multiRequest,
            }));
            populatedTxn = contract.encodeFunctionData("multiSequentialAttestBySig", [[mappedPayload], payloadHash, address, nonce, expiry, v, r, s]);
            contractAddress = contract.contractAddress;
        }
        else {
            // ethers Contract
            const tx = await contract.multiSequentialAttestBySig.populateTransaction([payload.map((p) => p.payload)], payloadHash, address, nonce, expiry, v, r, s);
            populatedTxn = tx.data;
            contractAddress = await contract.getAddress();
        }
        if (!populatedTxn)
            throw new Error("Transaction data is empty");
        const txn = await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contractAddress));
        const attestations = await this.getTransactionLogs(signer, txn);
        return {
            tx: [(0, unified_types_1.createTransaction)(txn)],
            uids: attestations,
        };
    }
    static async multiRevoke(signer, payload) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.multiRevokeBySig(signer, payload);
        }
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("multiRevoke", [payload]);
            return {
                tx: [(0, unified_types_1.createTransaction)(txHash)],
                uids: [],
            };
        }
        else {
            // ethers Contract
            const tx = await contract.multiRevoke(payload);
            return {
                tx: [tx],
                uids: [],
            };
        }
    }
    /**
     * Performs a multi revocation by signature.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiRevokeBySig(signer, payload) {
        const contract = await GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)(payload);
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        console.info({ r, s, v, nonce, chainId, payloadHash, address });
        let populatedTxn;
        let contractAddress;
        if (contract.encodeFunctionData) {
            // UniversalContract
            populatedTxn = contract.encodeFunctionData("multiRevokeBySig", [
                payload,
                payloadHash,
                address,
                nonce,
                expiry,
                v,
                r,
                s,
            ]);
            contractAddress = contract.contractAddress;
        }
        else {
            // ethers Contract
            const tx = await contract.multiRevokeBySig.populateTransaction(payload, payloadHash, address, nonce, expiry, v, r, s);
            populatedTxn = tx.data;
            contractAddress = await contract.getAddress();
        }
        if (!populatedTxn)
            throw new Error("Transaction data is empty");
        const txn = await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contractAddress));
        return {
            tx: [(0, unified_types_1.createTransaction)(txn)],
            uids: [],
        };
    }
    /**
     * Transfer the ownership of an attestation
     * @param signer
     * @param projectUID
     * @param newOwner
     * @returns
     */
    static async transferProjectOwnership(signer, projectUID, newOwner) {
        const contract = await GAP_1.GAP.getProjectResolver(signer);
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("transferProjectOwnership", [
                projectUID,
                newOwner,
            ]);
            // Wait for transaction
            if ((0, utils_1.isWalletClient)(signer)) {
                const walletClient = signer;
                const publicClient = walletClient;
                return publicClient.waitForTransactionReceipt({ hash: txHash });
            }
            else {
                const provider = signer.provider || signer;
                return provider.waitForTransaction(txHash);
            }
        }
        else {
            // ethers Contract
            const tx = await contract.transferProjectOwnership(projectUID, newOwner);
            return tx.wait?.();
        }
    }
    /**
     * Check if the signer is the owner of the project
     * @param signer
     * @param projectUID
     * @param projectChainId
     * @param publicAddress
     * @returns
     */
    static async isProjectOwner(signer, projectUID, projectChainId, publicAddress) {
        const contract = await GAP_1.GAP.getProjectResolver(signer, projectChainId);
        const address = publicAddress || (await this.getSignerAddress(signer));
        const isOwner = await contract.read("isOwner", [projectUID, address]);
        return isOwner;
    }
    /**
     * Check if the signer is admin of the project
     * @param signer
     * @param projectUID
     * @param projectChainId
     * @param publicAddress
     * @returns
     */
    static async isProjectAdmin(signer, projectUID, projectChainId, publicAddress) {
        const contract = await GAP_1.GAP.getProjectResolver(signer, projectChainId);
        const address = publicAddress || (await this.getSignerAddress(signer));
        // UniversalContract
        const isAdmin = await contract.read("isAdmin", [
            projectUID,
            address,
        ]);
        return isAdmin;
    }
    static async getTransactionLogs(signer, txnHash) {
        let receipt;
        // Wait for transaction
        if ((0, utils_1.isWalletClient)(signer)) {
            const walletClient = signer;
            const publicClient = walletClient;
            receipt = await publicClient.waitForTransactionReceipt({
                hash: txnHash,
            });
        }
        else {
            const provider = signer.provider || signer;
            receipt = await provider.waitForTransaction(txnHash);
        }
        if (!receipt || !receipt.logs?.length)
            throw new Error("Transaction not found");
        // Returns the txn logs with the attestation results
        return (0, eas_sdk_1.getUIDsFromAttestReceipt)(receipt);
    }
    /**
     * Add Project Admin
     * @param signer
     * @param projectUID
     * @param newAdmin
     * @returns
     */
    static async addProjectAdmin(signer, projectUID, newAdmin) {
        const contract = await GAP_1.GAP.getProjectResolver(signer);
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("addAdmin", [
                projectUID,
                newAdmin,
            ]);
            // Wait for transaction
            if ((0, utils_1.isWalletClient)(signer)) {
                const walletClient = signer;
                const publicClient = walletClient;
                return publicClient.waitForTransactionReceipt({ hash: txHash });
            }
            else {
                const provider = signer.provider || signer;
                return provider.waitForTransaction(txHash);
            }
        }
        else {
            // ethers Contract
            const tx = await contract.addAdmin(projectUID, newAdmin);
            return tx.wait?.();
        }
    }
    /**
     * Remove Project Admin
     * @param signer
     * @param projectUID
     * @param oldAdmin
     * @returns
     */
    static async removeProjectAdmin(signer, projectUID, oldAdmin) {
        const contract = await GAP_1.GAP.getProjectResolver(signer);
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("removeAdmin", [
                projectUID,
                oldAdmin,
            ]);
            // Wait for transaction
            if ((0, utils_1.isWalletClient)(signer)) {
                const walletClient = signer;
                const publicClient = walletClient;
                return publicClient.waitForTransactionReceipt({ hash: txHash });
            }
            else {
                const provider = signer.provider || signer;
                return provider.waitForTransaction(txHash);
            }
        }
        else {
            // ethers Contract
            const tx = await contract.removeAdmin(projectUID, oldAdmin);
            return tx.wait?.();
        }
    }
}
exports.GapContract = GapContract;
GapContract.nonces = {};
