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
    constructor(data) {
        data.data.type = "project-milestone";
        super(data);
        this.verified = [];
    }
    /**
     * Attest the status of the update as approved, rejected or completed.
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
     * Verify this ProjectUpdate. If the ProjectUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, data, callback) {
        console.log("Verifying");
        const schema = this.schema.gap.findSchema("ProjectMilestoneStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "verified",
                reason: data?.reason || "",
            }));
        }
        else {
            schema.setValue("type", "project-milestone-verified");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest project milestone verified");
        await this.attestStatus(signer, schema, callback);
        console.log("After attest project milestone verified");
        this.verified.push(new ProjectMilestoneStatus({
            data: {
                type: "project-milestone-verified",
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async complete(signer, data, callback) {
        console.log("Completing");
        const schema = this.schema.gap.findSchema("ProjectMilestoneStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "completed",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "project-milestone-completed");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest project milestone completed");
        await this.attestStatus(signer, schema, callback);
        console.log("After attest project milestone completed");
        this.completed = new attestations_1.MilestoneCompleted({
            data: {
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        });
    }
    /**
     * Revokes the completed status of the milestone. If the milestone is not completed,
     * it will throw an error.
     * @param signer
     */
    async revokeCompletion(signer, callback) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const { tx, uids } = await this.completed.schema.multiRevoke(signer, [
            {
                schemaId: this.completed.schema.uid,
                uid: this.completed.uid,
            },
        ], callback);
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
            // if (attestation.verified?.length > 0) {
            //   projectMilestone.verified = attestation.verified.map(
            //     (m) =>
            //       new ProjectMilestoneStatus({
            //         ...m,
            //         data: {
            //           ...m.data,
            //           type:
            //             m.data.type === "completed"
            //               ? "project-milestone-completed"
            //               : "project-milestone-verified",
            //         },
            //         schema: new AllGapSchemas().findSchema(
            //           "ProjectMilestoneStatus",
            //           chainIdToNetwork[attestation.chainID] as TNetwork
            //         ),
            //         chainID: attestation.chainID,
            //       })
            //   );
            // }
            if (attestation.completed) {
                projectMilestone.completed = new attestations_1.MilestoneCompleted({
                    ...attestation.completed,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            return projectMilestone;
        });
    }
}
exports.ProjectMilestone = ProjectMilestone;
