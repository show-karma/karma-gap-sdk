"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectMilestone = exports.ProjectMilestoneStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
const attestations_1 = require("../types/attestations");
class ProjectMilestoneStatus extends Attestation_1.Attestation {
}
exports.ProjectMilestoneStatus = ProjectMilestoneStatus;
class ProjectMilestone extends Attestation_1.Attestation {
    /**
     * Attest the status of the milestone as completed.
     */
    async attestStatus(signer, schema, callback) {
        const eas = this.schema.gap.eas.connect(signer);
        try {
            if (callback)
                callback("preparing");
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
            if (callback)
                callback("pending");
            const uid = await tx.wait();
            if (callback)
                callback("confirmed");
            console.log(uid);
            return {
                tx: [
                    {
                        hash: tx.tx.hash,
                    },
                ],
                uids: [uid],
            };
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message, error);
        }
    }
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async complete(signer, data, callback) {
        const schema = this.schema.gap.findSchema("ProjectMilestoneCompleted");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "completed",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "completed");
            schema.setValue("reason", data?.reason || "");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
        }
        const { tx, uids } = await this.attestStatus(signer, schema, callback);
        this.completed = new attestations_1.ProjectMilestoneCompleted({
            data: {
                type: "completed",
                ...data,
            },
            refUID: this.uid,
            schema,
            recipient: this.recipient,
        });
        return { tx, uids };
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const projectMilestone = new ProjectMilestone({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectMilestone", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.completed) {
                projectMilestone.completed = new attestations_1.ProjectMilestoneCompleted({
                    ...attestation.completed,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectMilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            return projectMilestone;
        });
    }
}
exports.ProjectMilestone = ProjectMilestone;
