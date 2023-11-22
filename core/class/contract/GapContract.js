"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapContract = void 0;
const GAP_1 = require("../GAP");
const serialize_bigint_1 = require("../../utils/serialize-bigint");
const send_gelato_txn_1 = require("../../utils/gelato/send-gelato-txn");
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
const AttestationDataTypes = {
    Attest: [
        { name: 'payloadHash', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
    ],
};
class GapContract {
    /**
     * Signs a message for the delegated attestation.
     * @param signer
     * @param payload
     * @returns r,s,v signature
     */
    static async signAttestation(signer, payload, expiry) {
        let { nonce } = await this.getNonce(signer);
        const { chainId } = await signer.provider.getNetwork();
        const domain = {
            chainId,
            name: 'gap-attestation',
            version: '1',
            verifyingContract: GAP_1.GAP.getMulticall(null).address,
        };
        const data = { payloadHash: payload, nonce, expiry };
        console.log({ domain, AttestationDataTypes, data });
        const signature = await signer._signTypedData(domain, AttestationDataTypes, data);
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
        const address = signer.address || signer._address || (await signer.getAddress());
        if (!address)
            throw new Error('Signer does not provider either address or getAddress().');
        return address;
    }
    /**
     * Get nonce for the transaction
     * @param address
     * @returns
     */
    static async getNonce(signer) {
        const contract = GAP_1.GAP.getMulticall(signer);
        const address = await this.getSignerAddress(signer);
        console.log({ address });
        const nonce = await contract.functions.nonces(address);
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
    static async attest(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.attestBySig(signer, payload);
        }
        const tx = await contract.functions.attest({
            schema: payload.schema,
            data: payload.data.payload,
        });
        const result = await tx.wait?.();
        const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result)[0];
        return attestations;
    }
    static async attestBySig(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)({
            schema: payload.schema,
            data: payload.data.raw,
        });
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        const { data: populatedTxn } = await contract.populateTransaction.attestBySig({
            data: payload.data.payload,
            schema: payload.schema,
        }, payloadHash, address, nonce, expiry, v, r, s);
        if (!populatedTxn)
            throw new Error('Transaction data is empty');
        const txn = await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contract.address));
        const attestations = await this.getTransactionLogs(signer, txn);
        return attestations[0];
    }
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiAttest(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.multiAttestBySig(signer, payload);
        }
        const tx = await contract.functions.multiSequentialAttest(payload.map((p) => p.payload));
        const result = await tx.wait?.();
        const attestations = (0, eas_sdk_1.getUIDsFromAttestReceipt)(result);
        return attestations;
    }
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiAttestBySig(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)(payload.map((p) => p.raw));
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        console.info({ r, s, v, nonce, chainId, payloadHash, address });
        const { data: populatedTxn } = await contract.populateTransaction.multiSequentialAttestBySig(payload.map((p) => p.payload), payloadHash, address, nonce, expiry, v, r, s);
        if (!populatedTxn)
            throw new Error('Transaction data is empty');
        const txn = await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contract.address));
        const attestations = await this.getTransactionLogs(signer, txn);
        return attestations;
    }
    static async multiRevoke(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        if (GAP_1.GAP.gelatoOpts?.useGasless) {
            return this.multiRevokeBySig(signer, payload);
        }
        const tx = await contract.functions.multiRevoke(payload);
        return tx.wait?.();
    }
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static async multiRevokeBySig(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
        const address = await this.getSignerAddress(signer);
        const payloadHash = (0, serialize_bigint_1.serializeWithBigint)(payload);
        const { r, s, v, nonce, chainId } = await this.signAttestation(signer, payloadHash, expiry);
        console.info({ r, s, v, nonce, chainId, payloadHash, address });
        const { data: populatedTxn } = await contract.populateTransaction.multiRevokeBySig(payload, payloadHash, address, nonce, expiry, v, r, s);
        if (!populatedTxn)
            throw new Error('Transaction data is empty');
        await (0, send_gelato_txn_1.sendGelatoTxn)(...send_gelato_txn_1.Gelato.buildArgs(populatedTxn, chainId, contract.address));
    }
    static async getTransactionLogs(signer, txnHash) {
        const txn = await signer.provider.getTransactionReceipt(txnHash);
        if (!txn || !txn.logs.length)
            throw new Error('Transaction not found');
        // Returns the txn logs with the attestation results. Tha last two logs are the
        // the ones from the GelatoRelay contract.
        return (0, eas_sdk_1.getUIDsFromAttestReceipt)(txn);
    }
}
exports.GapContract = GapContract;
GapContract.nonces = {};
