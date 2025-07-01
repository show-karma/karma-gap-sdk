"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectMilestone = exports.ProjectMilestoneStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
const unified_types_1 = require("../../utils/unified-types");
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
        const { connectEAS } = await Promise.resolve().then(() => __importStar(require("../../utils/eas-wrapper")));
        const eas = connectEAS(this.schema.gap.eas, signer);
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
                    (0, unified_types_1.createTransaction)(tx.tx.hash),
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
                type: "project-milestone-completed",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "project-milestone-completed");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest project milestone completed");
        const { tx, uids } = await this.attestStatus(signer, schema, callback);
        console.log("After attest project milestone completed");
        this.completed = new attestations_1.MilestoneCompleted({
            data: {
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        });
        return { tx, uids };
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
            if (attestation.verified?.length > 0) {
                projectMilestone.verified = attestation.verified.map((m) => new ProjectMilestoneStatus({
                    ...m,
                    data: {
                        ...m.data,
                        type: m.data.type === "completed"
                            ? "project-milestone-completed"
                            : "project-milestone-verified",
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectMilestoneStatus", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
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
