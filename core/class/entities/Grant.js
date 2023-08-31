"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grant = void 0;
const Attestation_1 = require("../Attestation");
const Milestone_1 = require("./Milestone");
const GapSchema_1 = require("../GapSchema");
const GAP_1 = require("../GAP");
const SchemaError_1 = require("../SchemaError");
const consts_1 = require("../../consts");
class Grant extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.milestones = [];
    }
    async verify(signer) {
        const eas = GAP_1.GAP.eas.connect(signer);
        const schema = GapSchema_1.GapSchema.find("MilestoneApproved");
        schema.setValue("approved", true);
        try {
            await eas.attest({
                schema: schema.raw,
                data: {
                    recipient: this.recipient,
                    data: schema.encode(),
                    refUID: this.uid,
                    expirationTime: 0n,
                    revocable: schema.revocable,
                },
            });
            this.verified = true;
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
    /**
     * Add milestones to the grant.
     * @param signer
     * @param milestones
     */
    async addMilestones(signer, milestones) {
        const eas = GAP_1.GAP.eas.connect(signer);
        const schema = GapSchema_1.GapSchema.find("Milestone");
        const newMilestones = milestones.map((milestone) => {
            const m = new Milestone_1.Milestone({
                data: milestone,
                refUID: this.uid,
                schema,
                createdAt: Date.now(),
                recipient: this.recipient,
                uid: consts_1.nullRef,
            });
            return m;
        });
        try {
            const attestations = await this.schema.multiAttest(signer, newMilestones);
            newMilestones.forEach((m, idx) => {
                Object.assign(m, { uid: attestations[idx] });
            });
            this.milestones.push(...newMilestones);
            console.log("milestones", this.milestones);
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
}
exports.Grant = Grant;
