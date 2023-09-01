"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Milestone = void 0;
const Attestation_1 = require("../Attestation");
const GAP_1 = require("../GAP");
const GapSchema_1 = require("../GapSchema");
const SchemaError_1 = require("../SchemaError");
class Milestone extends Attestation_1.Attestation {
    async approve(signer) {
        const eas = GAP_1.GAP.eas.connect(signer);
        const schema = GapSchema_1.GapSchema.find("MilestoneApproved");
        schema.setValue("isVerified", true);
        if (!this.completed)
            throw new SchemaError_1.AttestationError("INVALID_DATA", "Milestone must be completed before approving");
        try {
            await eas.attest({
                schema: schema.uid,
                data: {
                    recipient: this.recipient,
                    data: schema.encode(),
                    refUID: this.uid,
                    expirationTime: 0n,
                    revocable: schema.revocable,
                },
            });
            this.approved = true;
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
    async complete(signer) {
        const eas = GAP_1.GAP.eas.connect(signer);
        const schema = GapSchema_1.GapSchema.find("MilestoneCompleted");
        schema.setValue("isVerified", true);
        try {
            const tx = await eas.attest({
                schema: schema.uid,
                data: {
                    recipient: this.recipient,
                    data: schema.encode(),
                    refUID: this.uid,
                    expirationTime: 0n,
                    revocable: schema.revocable,
                },
            });
            const uid = await tx.wait();
            console.log(uid);
            this.completed = true;
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
}
exports.Milestone = Milestone;
