"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContributorProfile = void 0;
const Attestation_1 = require("../Attestation");
const consts_1 = require("../../consts");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
class ContributorProfile extends Attestation_1.Attestation {
    constructor(data) {
        data.data.type = "contributor-profile";
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
        console.log("Attesting ContributorProfile");
        try {
            if (callback)
                callback("preparing");
            const { tx: ContributorProfileTx, uids: ContributorProfileUID } = await this.schema.attest({
                signer,
                to: this.recipient,
                refUID: consts_1.nullRef,
                data: this.data,
            });
            this._uid = ContributorProfileUID[0];
            console.log(this.uid);
            if (callback)
                callback("pending");
            if (callback)
                callback("confirmed");
            return { tx: ContributorProfileTx, uids: ContributorProfileUID };
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.", error);
        }
    }
    static from(attestation, network) {
        return new ContributorProfile({
            ...attestation,
            data: {
                ...attestation.data,
            },
            schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ContributorProfile", consts_1.chainIdToNetwork[attestation.chainID]),
            chainID: attestation.chainID,
        });
    }
}
exports.ContributorProfile = ContributorProfile;
