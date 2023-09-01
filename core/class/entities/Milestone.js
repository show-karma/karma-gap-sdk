"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Milestone = void 0;
const Attestation_1 = require("../Attestation");
const GAP_1 = require("../GAP");
const GapSchema_1 = require("../GapSchema");
const SchemaError_1 = require("../SchemaError");
const to_unix_1 = require("../../utils/to-unix");
const attestations_1 = require("../types/attestations");
class Milestone extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.startsAt = (0, to_unix_1.toUnix)(Date.now());
        this.endsAt = (0, to_unix_1.toUnix)(Date.now());
    }
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async approve(signer, reason) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        if (this.approved)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is already approved");
        await this.attestStatus(signer, GapSchema_1.GapSchema.find("MilestoneApproved"), reason);
        this.approved = new attestations_1.MilestoneCompleted({
            data: {
                type: "approved",
                reason,
            },
            refUID: this.uid,
            schema: GapSchema_1.GapSchema.find("MilestoneApproved"),
            recipient: this.recipient,
        });
    }
    /**
     * Revokes the approved status of the milestone. If the milestone is not approved,
     * it will throw an error.
     * @param signer
     */
    async revokeApproval(signer) {
        if (!this.approved)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not approved");
        await this.approved.revoke(signer);
    }
    /**
     * Reject a completed milestone. If the milestone is not completed or already rejected,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async reject(signer, reason) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        if (this.rejected)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is already rejected");
        await this.attestStatus(signer, GapSchema_1.GapSchema.find("MilestoneApproved"), reason);
        this.rejected = new attestations_1.MilestoneCompleted({
            data: {
                type: "rejected",
                reason,
            },
            refUID: this.uid,
            schema: GapSchema_1.GapSchema.find("MilestoneApproved"),
            recipient: this.recipient,
        });
    }
    /**
     * Revokes the rejected status of the milestone. If the milestone is not rejected,
     * it will throw an error.
     * @param signer
     */
    async revokeRejection(signer) {
        if (!this.rejected)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not rejected");
        await this.rejected.revoke(signer);
    }
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async complete(signer, reason) {
        if (this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is already completed");
        const schema = GapSchema_1.GapSchema.find("MilestoneCompleted");
        schema.setValue("isVerified", true);
        await this.attestStatus(signer, schema, reason);
        this.completed = new attestations_1.MilestoneCompleted({
            data: {
                type: "completed",
                reason,
            },
            refUID: this.uid,
            schema,
            recipient: this.recipient,
        });
    }
    /**
     * Revokes the completed status of the milestone. If the milestone is not completed,
     * it will throw an error.
     * @param signer
     */
    async revokeCompletion(signer) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        await this.completed.revoke(signer);
    }
    /**
     * Attest the status of the milestone as approved, rejected or completed.
     */
    async attestStatus(signer, schema, reason) {
        const eas = GAP_1.GAP.eas.connect(signer);
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
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message);
        }
    }
}
exports.Milestone = Milestone;
