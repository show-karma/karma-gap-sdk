"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSummary = void 0;
const Attestation_1 = require("../Attestation");
const consts_1 = require("../../consts");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
class UserSummary extends Attestation_1.Attestation {
    constructor(data) {
        data.data.type = "user-summary";
        super(data);
    }
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param refIdx
     */
    async multiAttestPayload() {
        const payload = [[this, await this.payloadFor(0)]];
        return payload;
    }
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    async attest(signer, callback) {
        console.log("Attesting UserSummary");
        try {
            if (callback)
                callback("preparing");
            const { tx: UserSummaryTx, uids: UserSummaryUID } = await this.schema.attest({
                signer,
                to: this.recipient,
                refUID: consts_1.nullRef,
                data: this.data,
            });
            this._uid = UserSummaryUID[0];
            console.log(this.uid);
            if (callback)
                callback("pending");
            if (callback)
                callback("confirmed");
            return { tx: UserSummaryTx, uids: UserSummaryUID };
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.", error);
        }
    }
    static from(attestation, network) {
        return new UserSummary({
            ...attestation,
            data: {
                ...attestation.data,
            },
            schema: new AllGapSchemas_1.AllGapSchemas().findSchema("UserSummary", consts_1.chainIdToNetwork[attestation.chainID]),
            chainID: attestation.chainID,
        });
    }
}
exports.UserSummary = UserSummary;
