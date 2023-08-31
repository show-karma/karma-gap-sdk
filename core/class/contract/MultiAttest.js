"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAttest = void 0;
const GAP_1 = require("../GAP");
class MultiAttest {
    /**
     * Performs a referenced multi attestation.
     *
     * @returns an array with the attestation UIDs.
     */
    static async send(signer, payload) {
        const contract = GAP_1.GAP.getMulticall(signer);
        const tx = await contract.functions.multiSequentialAttest(payload);
        const result = await tx.wait?.();
        const attestations = result.logs?.map((m) => m.data);
        return attestations;
    }
}
exports.MultiAttest = MultiAttest;
