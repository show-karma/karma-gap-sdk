"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapContract = void 0;
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
const unified_types_1 = require("../../utils/unified-types");
const send_gelato_txn_1 = require("../../utils/gelato/send-gelato-txn");
const serialize_bigint_1 = require("../../utils/serialize-bigint");
const utils_1 = require("../../utils");
const GAP_1 = require("../GAP");
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
        if (contract.read) {
            // UniversalContract
            nonce = (await contract.read("nonces", [address]));
        }
        else {
            // ethers Contract
            nonce = await contract.nonces(address);
        }
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
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.attestBySig(signer, payload);
        }
        callback?.("preparing");
        let tx;
        let result;
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("attest", [
                {
                    schema: payload.schema,
                    data: payload.data.payload,
                },
            ]);
            callback?.("pending");
            // Wait for transaction using viem
            if ((0, utils_1.isWalletClient)(signer)) {
                const walletClient = signer;
                const publicClient = walletClient; // Wallet clients can read too
                result = await publicClient.waitForTransactionReceipt({ hash: txHash });
            }
            else {
                // For ethers, use the provider's wait method
                const provider = signer.provider || signer;
                result = await provider.waitForTransaction(txHash);
            }
            callback?.("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result)[0];
            return {
                tx: [(0, unified_types_1.createTransaction)(txHash)],
                uids: [attestations],
            };
        }
        else {
            // ethers Contract
            tx = await contract
                .attest({
                schema: payload.schema,
                data: payload.data.payload,
            })
                .then((res) => {
                callback?.("pending");
                return res;
            });
            result = await tx.wait?.();
            callback?.("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result)[0];
            const resultArray = [result].flat();
            return {
                tx: resultArray,
                uids: [attestations],
            };
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
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.multiAttestBySig(signer, payload);
        }
        if (callback)
            callback("preparing");
        let tx;
        let result;
        if (contract.write) {
            // UniversalContract
            const txHash = await contract.write("multiSequentialAttest", [
                payload.map((p) => p.payload),
            ]);
            if (callback)
                callback("pending");
            // Wait for transaction using viem
            if ((0, utils_1.isWalletClient)(signer)) {
                const walletClient = signer;
                const publicClient = walletClient; // Wallet clients can read too
                result = await publicClient.waitForTransactionReceipt({ hash: txHash });
            }
            else {
                // For ethers, use the provider's wait method
                const provider = signer.provider || signer;
                result = await provider.waitForTransaction(txHash);
            }
            if (callback)
                callback("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result);
            return {
                tx: [(0, unified_types_1.createTransaction)(txHash)],
                uids: attestations,
            };
        }
        else {
            // ethers Contract
            tx = await contract.multiSequentialAttest(payload.map((p) => p.payload));
            if (callback)
                callback("pending");
            result = await tx.wait?.();
            if (callback)
                callback("confirmed");
            const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result);
            const resultArray = [result].flat();
            return {
                tx: resultArray,
                uids: attestations,
            };
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
            populatedTxn = contract.encodeFunctionData("multiSequentialAttestBySig", [
                payload.map((p) => p.payload),
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
            const tx = await contract.multiSequentialAttestBySig.populateTransaction(payload.map((p) => p.payload), payloadHash, address, nonce, expiry, v, r, s);
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
        if (contract.read) {
            // UniversalContract
            const isOwner = await contract.read("isOwner", [
                projectUID,
                address,
            ]);
            return isOwner;
        }
        else {
            // ethers Contract
            const isOwner = await contract.isOwner(projectUID, address);
            return isOwner;
        }
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
        if (contract.read) {
            // UniversalContract
            const isAdmin = await contract.read("isAdmin", [
                projectUID,
                address,
            ]);
            return isAdmin;
        }
        else {
            // ethers Contract
            const isAdmin = await contract.isAdmin(projectUID, address);
            return isAdmin;
        }
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
