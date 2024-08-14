"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberOf = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const GapContract_1 = require("../contract/GapContract");
class MemberOf extends Attestation_1.Attestation {
    async multiAttestPayload(currentPayload = [], projectIdx = 0) {
        const payload = [...currentPayload];
        const memberIdx = payload.push([this, await this.payloadFor(projectIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, await this.details.payloadFor(memberIdx)]);
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    async attest(signer, callback) {
        const payload = await this.multiAttestPayload();
        try {
            const { uids, tx } = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]), callback);
            const [memberUID, detailsUID] = uids;
            this.uid = memberUID;
            if (this.details && detailsUID) {
                this.details.uid = detailsUID;
            }
            return { tx, uids };
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
}
exports.MemberOf = MemberOf;
