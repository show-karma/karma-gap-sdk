"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grant = void 0;
const Attestation_1 = require("../Attestation");
const Milestone_1 = require("./Milestone");
const GapSchema_1 = require("../GapSchema");
const GAP_1 = require("../GAP");
const SchemaError_1 = require("../SchemaError");
const consts_1 = require("../../consts");
const GapContract_1 = require("../contract/GapContract");
class Grant extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = false;
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
    addMilestones(milestones) {
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
        this.milestones.push(...newMilestones);
    }
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param projectIdx
     */
    multiAttestPayload(currentPayload = [], projectIdx = 0) {
        this.assertPayload();
        const payload = [...currentPayload];
        const grantIdx = payload.push([this, this.payloadFor(projectIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, this.details.payloadFor(grantIdx)]);
        }
        if (this.milestones.length) {
            this.milestones.forEach((m) => {
                payload.push([m, m.payloadFor(grantIdx)]);
            });
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    /**
     * @inheritdoc
     */
    async attest(signer) {
        this.assertPayload();
        const payload = this.multiAttestPayload();
        const uids = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]));
        uids.forEach((uid, index) => {
            payload[index][0].uid = uid;
        });
        console.log(uids);
    }
    /**
     * Validate if the grant has a valid reference to a community.
     */
    assertPayload() {
        if (!this.details || !this.communityUID) {
            throw new SchemaError_1.AttestationError("INVALID_REFERENCE", "Grant should include a valid reference to a community on its details.");
        }
        return true;
    }
}
exports.Grant = Grant;
