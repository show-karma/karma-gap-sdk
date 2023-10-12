"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Milestone = void 0;
const Attestation_1 = require("../Attestation");
const GAP_1 = require("../GAP");
const GapSchema_1 = require("../GapSchema");
const SchemaError_1 = require("../SchemaError");
const attestations_1 = require("../types/attestations");
class Milestone extends Attestation_1.Attestation {
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async approve(signer, reason = "") {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = GapSchema_1.GapSchema.find("MilestoneCompleted");
        schema.setValue("type", "approved");
        schema.setValue("reason", reason);
        await this.attestStatus(signer, schema);
        this.approved = new attestations_1.MilestoneCompleted({
            data: {
                type: "approved",
                reason,
            },
            refUID: this.uid,
            schema: schema,
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
    async reject(signer, reason = "") {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = GapSchema_1.GapSchema.find("MilestoneCompleted");
        schema.setValue("type", "rejected");
        schema.setValue("reason", reason);
        await this.attestStatus(signer, schema);
        this.rejected = new attestations_1.MilestoneCompleted({
            data: {
                type: "rejected",
                reason,
            },
            refUID: this.uid,
            schema: schema,
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
    async complete(signer, reason = "") {
        const schema = GapSchema_1.GapSchema.find("MilestoneCompleted");
        schema.setValue("type", "completed");
        schema.setValue("reason", reason);
        await this.attestStatus(signer, schema);
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
    async attestStatus(signer, schema) {
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
    static from(attestations) {
        return attestations.map((attestation) => {
            const milestone = new Milestone({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: GapSchema_1.GapSchema.find("Milestone"),
            });
            if (attestation.completed) {
                milestone.completed = new attestations_1.MilestoneCompleted({
                    ...attestation.completed,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: GapSchema_1.GapSchema.find("MilestoneCompleted"),
                });
            }
            if (attestation.approved) {
                milestone.approved = new attestations_1.MilestoneCompleted({
                    ...attestation.approved,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: GapSchema_1.GapSchema.find("MilestoneCompleted"),
                });
            }
            if (attestation.rejected) {
                milestone.rejected = new attestations_1.MilestoneCompleted({
                    ...attestation.rejected,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: GapSchema_1.GapSchema.find("MilestoneCompleted"),
                });
            }
            return milestone;
        });
    }
}
exports.Milestone = Milestone;
