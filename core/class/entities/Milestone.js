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
exports.Milestone = void 0;
const unified_types_1 = require("../../utils/unified-types");
const consts_1 = require("../../consts");
const AllGapSchemas_1 = require("../AllGapSchemas");
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const GapContract_1 = require("../contract/GapContract");
const attestations_1 = require("../types/attestations");
/**
 * Milestone class represents a milestone that can be attested to one or multiple grants.
 *
 * It provides methods to:
 * - Create, complete, approve, reject, and verify milestones
 * - Attest a milestone to a single grant
 * - Attest a milestone to multiple grants in a single transaction
 * - Complete, approve, and verify milestones across multiple grants
 * - Revoke multiple milestone attestations at once
 */
class Milestone extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = [];
        this.type = "milestone";
    }
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async approve(signer, data, callback) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "approved",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "approved");
            schema.setValue("reason", data?.reason || "");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
        }
        await this.attestStatus(signer, schema, callback);
        this.approved = new attestations_1.MilestoneCompleted({
            data: {
                type: "approved",
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        });
    }
    /**
     * Approves this milestone across multiple grants. If the milestones are not completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param milestoneUIDs - Array of milestone UIDs to approve
     * @param data - Optional approval data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    async approveMultipleGrants(signer, milestoneUIDs, data, callback) {
        // Validate that all milestones are completed
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "approved",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "approved");
            schema.setValue("reason", data?.reason || "");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
        }
        // Create approval attestations for each milestone
        const approvalPayloads = [];
        for (const milestoneUID of milestoneUIDs) {
            const approved = new attestations_1.MilestoneCompleted({
                data: {
                    type: "approved",
                    ...data,
                },
                refUID: milestoneUID,
                schema,
                recipient: this.recipient,
            });
            // Add approval to the payload
            approvalPayloads.push([
                approved,
                await approved.payloadFor(0), // Index doesn't matter for approval
            ]);
        }
        // Attest all approvals at once
        const result = await GapContract_1.GapContract.multiAttest(signer, approvalPayloads.map((p) => p[1]), callback);
        // Save the first approval to this milestone instance
        if (result.uids.length > 0) {
            this.approved = new attestations_1.MilestoneCompleted({
                data: {
                    type: "approved",
                    ...data,
                },
                refUID: milestoneUIDs[0],
                uid: result.uids[0],
                schema,
                recipient: this.recipient,
            });
        }
        return result;
    }
    /**
     * Revokes the approved status of the milestone. If the milestone is not approved,
     * it will throw an error.
     * @param signer
     */
    async revokeApproval(signer) {
        if (!this.approved)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not approved");
        await this.approved.schema.multiRevoke(signer, [
            {
                schemaId: this.completed.schema.uid,
                uid: this.completed.uid,
            },
        ]);
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
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
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
        const { tx, uids } = await this.rejected.schema.multiRevoke(signer, [
            {
                schemaId: this.completed.schema.uid,
                uid: this.completed.uid,
            },
        ]);
        return { tx, uids };
    }
    /**
     * Revokes multiple milestone attestations at once.
     * This method can be used to revoke multiple milestone attestations in a single transaction.
     *
     * @param signer - The signer to use for revocation
     * @param attestationsToRevoke - Array of objects containing schemaId and uid of attestations to revoke
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs of revoked attestations
     */
    async revokeMultipleAttestations(signer, attestationsToRevoke, callback) {
        if (attestationsToRevoke.length === 0) {
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "No attestations specified for revocation");
        }
        // Group the attestations by schema ID
        const groupedAttestations = attestationsToRevoke.reduce((acc, { schemaId, uid }) => {
            if (!acc[schemaId]) {
                acc[schemaId] = [];
            }
            acc[schemaId].push(uid);
            return acc;
        }, {});
        // Convert to the format expected by GapContract.multiRevoke
        const revocationPayload = Object.entries(groupedAttestations).map(([schemaId, uids]) => ({
            schema: schemaId,
            data: uids.map((uid) => ({
                uid,
                value: 0n, // EAS contract requires a value field as BigInt
            })),
        }));
        // Use GapContract.multiRevoke directly with the correct payload format
        const result = await GapContract_1.GapContract.multiRevoke(signer, revocationPayload);
        if (callback) {
            callback("confirmed");
        }
        return result;
    }
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async complete(signer, data, callback) {
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
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
        this.completed = new attestations_1.MilestoneCompleted({
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
    /**
     * Marks a milestone as completed across multiple grants. If the milestone is already completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param grantIndices - Array of grant indices to attest this milestone to, or array of milestone UIDs
     * @param data - Optional completion data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    async completeForMultipleGrants(signer, grantIndicesOrMilestoneUIDs = [0], data, callback) {
        // Check if we're dealing with UIDs instead of indices
        const isUids = grantIndicesOrMilestoneUIDs.length > 0 &&
            typeof grantIndicesOrMilestoneUIDs[0] === "string";
        let milestoneUIDs = [];
        if (isUids) {
            // We already have milestone UIDs
            milestoneUIDs = grantIndicesOrMilestoneUIDs;
        }
        else {
            // First attest the milestone to multiple grants if not already attested
            const attestResult = await this.attestToMultipleGrants(signer, grantIndicesOrMilestoneUIDs, callback);
            milestoneUIDs = attestResult.uids;
        }
        // Now complete the milestone for each attested milestone
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
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
        // Create completion attestations for each milestone
        const completionPayloads = [];
        for (let i = 0; i < milestoneUIDs.length; i++) {
            const milestoneUID = milestoneUIDs[i];
            // Only set this.uid if we're dealing with indices and need to update the current milestone
            if (!isUids) {
                this.uid = milestoneUID; // Set the current UID to the milestone being completed
            }
            const completed = new attestations_1.MilestoneCompleted({
                data: {
                    type: "completed",
                    ...data,
                },
                refUID: milestoneUID,
                schema,
                recipient: this.recipient,
            });
            // Add completed status to the payload
            completionPayloads.push([completed, await completed.payloadFor(i)]);
        }
        // Attest all completions at once
        const completionResult = await GapContract_1.GapContract.multiAttest(signer, completionPayloads.map((p) => p[1]), callback);
        // Save the first completion to this milestone instance
        if (completionResult.uids.length > 0 && !isUids) {
            this.completed = new attestations_1.MilestoneCompleted({
                data: {
                    type: "completed",
                    ...data,
                },
                refUID: milestoneUIDs[0],
                uid: completionResult.uids[0],
                schema,
                recipient: this.recipient,
            });
        }
        return isUids
            ? completionResult // If we're using UIDs directly, just return completion result
            : {
                tx: [
                    ...(milestoneUIDs.length ? [(0, unified_types_1.createTransaction)("")] : []),
                    ...completionResult.tx,
                ],
                uids: [...milestoneUIDs, ...completionResult.uids],
            };
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
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param grantIdx
     */
    async multiAttestPayload(currentPayload = [], grantIdx = 0) {
        this.assertPayload();
        const payload = [...currentPayload];
        const milestoneIdx = payload.push([this, await this.payloadFor(grantIdx)]) - 1;
        if (this.completed) {
            payload.push([
                this.completed,
                await this.completed.payloadFor(milestoneIdx),
            ]);
        }
        if (this.verified.length > 0) {
            await Promise.all(this.verified.map(async (m) => {
                const payloadForMilestone = await m.payloadFor(milestoneIdx);
                if (Array.isArray(payloadForMilestone)) {
                    payloadForMilestone.forEach((item) => payload.push(item));
                }
            }));
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    /**
     * Creates the payload for a multi-attestation across multiple grants.
     *
     * This method allows for the same milestone to be attested to multiple grants
     * in a single transaction.
     *
     * @param currentPayload - Current payload to append to
     * @param grantIndices - Array of grant indices to attest this milestone to
     * @returns The multi-attest payload with all grant attestations
     */
    async multiGrantAttestPayload(currentPayload = [], grantIndices = [0]) {
        this.assertPayload();
        const payload = [...currentPayload];
        const milestoneIndices = [];
        // Create milestone attestation for each grant
        for (const grantIdx of grantIndices) {
            const milestoneIdx = payload.push([this, await this.payloadFor(grantIdx)]) - 1;
            milestoneIndices.push(milestoneIdx);
        }
        // Add completed status if exists for each milestone
        if (this.completed) {
            for (const milestoneIdx of milestoneIndices) {
                payload.push([
                    this.completed,
                    await this.completed.payloadFor(milestoneIdx),
                ]);
            }
        }
        // Add verifications if exist for each milestone
        if (this.verified.length > 0) {
            for (const milestoneIdx of milestoneIndices) {
                await Promise.all(this.verified.map(async (m) => {
                    const payloadForMilestone = await m.payloadFor(milestoneIdx);
                    if (Array.isArray(payloadForMilestone)) {
                        payloadForMilestone.forEach((item) => payload.push(item));
                    }
                }));
            }
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    /**
     * Attests this milestone to multiple grants in a single transaction.
     *
     * @param signer - The signer to use for attestation
     * @param grantIndices - Array of grant indices to attest this milestone to, or array of grant UIDs
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    async attestToMultipleGrants(signer, grantIndices = [0], callback) {
        this.assertPayload();
        // Check if we're dealing with Hex UIDs instead of indices
        const isUids = grantIndices.length > 0 && typeof grantIndices[0] === "string";
        if (isUids) {
            // Direct approach - create individual milestone instances for each grant UID
            const grantUIDs = grantIndices;
            const allPayloads = [];
            for (const grantUID of grantUIDs) {
                // Create a new milestone for each grant with direct reference
                const grantMilestone = new Milestone({
                    schema: this.schema,
                    recipient: this.recipient,
                    data: this.data,
                    refUID: grantUID,
                });
                // Generate payload for this grant
                const payload = await grantMilestone.multiAttestPayload();
                // Add each item from payload to allPayloads
                payload.forEach((item) => allPayloads.push(item));
            }
            // Attest all milestones in a single transaction
            const result = await GapContract_1.GapContract.multiAttest(signer, allPayloads.map((p) => p[1]), callback);
            return result;
        }
        else {
            // Original implementation using grantIndices
            const payload = await this.multiGrantAttestPayload([], grantIndices);
            const { uids, tx } = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]), callback);
            if (Array.isArray(uids)) {
                uids.forEach((uid, index) => {
                    payload[index][0].uid = uid;
                });
            }
            return { tx, uids };
        }
    }
    /**
     * @inheritdoc
     */
    async attest(signer, callback) {
        this.assertPayload();
        const payload = await this.multiAttestPayload();
        const { uids, tx } = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]), callback);
        if (Array.isArray(uids)) {
            uids.forEach((uid, index) => {
                payload[index][0].uid = uid;
            });
        }
        console.log(uids);
        return { tx, uids };
    }
    /**
     * Attest the status of the milestone as approved, rejected or completed.
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
                tx: [(0, unified_types_1.createTransaction)(tx.tx.hash)],
                uids: [uid],
            };
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", error.message, error);
        }
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const milestone = new Milestone({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("Milestone", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.completed) {
                milestone.completed = new attestations_1.MilestoneCompleted({
                    ...attestation.completed,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.approved) {
                milestone.approved = new attestations_1.MilestoneCompleted({
                    ...attestation.approved,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.rejected) {
                milestone.rejected = new attestations_1.MilestoneCompleted({
                    ...attestation.rejected,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.verified?.length > 0) {
                milestone.verified = attestation.verified.map((m) => new attestations_1.MilestoneCompleted({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MilestoneCompleted", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return milestone;
        });
    }
    /**
     * Verify this milestone. If the milestone is not completed or already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, data, callback) {
        console.log("Verifying");
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "verified",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "verified");
            schema.setValue("reason", data?.reason || "");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
        }
        console.log("Before attestStatus");
        const { tx, uids } = await this.attestStatus(signer, schema, callback);
        console.log("After attestStatus");
        this.verified.push(new attestations_1.MilestoneCompleted({
            data: {
                type: "verified",
                ...data,
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
        return { tx, uids };
    }
    /**
     * Verifies this milestone across multiple grants. If the milestones are not completed,
     * it will throw an error.
     * @param signer - The signer to use for attestation
     * @param milestoneUIDs - Array of milestone UIDs to verify
     * @param data - Optional verification data
     * @param callback - Optional callback function for status updates
     * @returns Promise with transaction and UIDs
     */
    async verifyMultipleGrants(signer, milestoneUIDs, data, callback) {
        // Validate that all milestones are completed
        if (!this.completed)
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Milestone is not completed");
        const schema = this.schema.gap.findSchema("MilestoneCompleted");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "verified",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "verified");
            schema.setValue("reason", data?.reason || "");
            schema.setValue("proofOfWork", data?.proofOfWork || "");
        }
        // Create verification attestations for each milestone
        const verificationPayloads = [];
        for (const milestoneUID of milestoneUIDs) {
            const verified = new attestations_1.MilestoneCompleted({
                data: {
                    type: "verified",
                    ...data,
                },
                refUID: milestoneUID,
                schema,
                recipient: this.recipient,
            });
            // Add verification to the payload
            verificationPayloads.push([
                verified,
                await verified.payloadFor(0), // Index doesn't matter for verification
            ]);
        }
        // Attest all verifications at once
        const result = await GapContract_1.GapContract.multiAttest(signer, verificationPayloads.map((p) => p[1]), callback);
        // Save the verifications to this milestone instance
        if (result.uids.length > 0) {
            for (let i = 0; i < result.uids.length; i++) {
                this.verified.push(new attestations_1.MilestoneCompleted({
                    data: {
                        type: "verified",
                        ...data,
                    },
                    refUID: milestoneUIDs[i],
                    uid: result.uids[i],
                    schema,
                    recipient: this.recipient,
                }));
            }
        }
        return result;
    }
}
exports.Milestone = Milestone;
