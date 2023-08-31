"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Community = void 0;
const Attestation_1 = require("../Attestation");
const attestations_1 = require("../types/attestations");
const consts_1 = require("../../consts");
const SchemaError_1 = require("../SchemaError");
const GapSchema_1 = require("../GapSchema");
const MultiAttest_1 = require("../contract/MultiAttest");
class Community extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.projects = [];
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
    multiAttestPayload() {
        const payload = [[this, this.payloadFor(0)]];
        if (this.details) {
            payload.push([this.details, this.details.payloadFor(0)]);
        }
        if (this.projects?.length) {
            this.projects.forEach((p) => {
                payload.push(...p.multiAttestPayload(payload, 0));
            });
        }
        return payload;
    }
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    async attest(signer, details) {
        console.log("Attesting community");
        try {
            if (details) {
                this.details = new attestations_1.CommunityDetails({
                    data: details,
                    schema: GapSchema_1.GapSchema.find("CommunityDetails"),
                    uid: consts_1.nullRef,
                    recipient: this.recipient,
                });
            }
            const payload = this.multiAttestPayload();
            const uids = await MultiAttest_1.MultiAttest.send(signer, payload.map((p) => p[1]));
            uids.forEach((uid, index) => {
                payload[index][0].uid = uid;
            });
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.");
        }
    }
}
exports.Community = Community;
