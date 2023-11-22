"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberOf = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const GapContract_1 = require("../contract/GapContract");
class MemberOf extends Attestation_1.Attestation {
    multiAttestPayload(currentPayload = [], projectIdx = 0) {
        const payload = [...currentPayload];
        const memberIdx = payload.push([this, this.payloadFor(projectIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, this.details.payloadFor(memberIdx)]);
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    async attest(signer) {
        const payload = this.multiAttestPayload();
        try {
            const [memberUID, detailsUID] = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]));
            this.uid = memberUID;
            if (this.details && detailsUID) {
                this.details.uid = detailsUID;
            }
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
}
exports.MemberOf = MemberOf;
