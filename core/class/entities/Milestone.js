"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Milestone = void 0;
const consts_1 = require("../../consts");
const AllGapSchemas_1 = require("../AllGapSchemas");
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const GapContract_1 = require("../contract/GapContract");
const attestations_1 = require("../types/attestations");
class Milestone extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = [];
        this.type = 'milestone';
    }
    /**
     * Approves this milestone. If the milestone is not completed or already approved,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async approve(signer, reason = '', callback) {
        if (!this.completed)
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not completed');
        const schema = this.schema.gap.findSchema('MilestoneCompleted');
        schema.setValue('type', 'approved');
        schema.setValue('reason', reason);
        await this.attestStatus(signer, schema);
        this.approved = new attestations_1.MilestoneCompleted({
            data: {
                type: 'approved',
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
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not approved');
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
    async reject(signer, reason = '') {
        if (!this.completed)
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not completed');
        const schema = this.schema.gap.findSchema('MilestoneCompleted');
        schema.setValue('type', 'rejected');
        schema.setValue('reason', reason);
        await this.attestStatus(signer, schema);
        this.rejected = new attestations_1.MilestoneCompleted({
            data: {
                type: 'rejected',
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
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not rejected');
        await this.rejected.schema.multiRevoke(signer, [
            {
                schemaId: this.completed.schema.uid,
                uid: this.completed.uid,
            },
        ]);
    }
    /**
     * Marks a milestone as completed. If the milestone is already completed,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async complete(signer, reason = '') {
        const schema = this.schema.gap.findSchema('MilestoneCompleted');
        schema.setValue('type', 'completed');
        schema.setValue('reason', reason);
        await this.attestStatus(signer, schema);
        this.completed = new attestations_1.MilestoneCompleted({
            data: {
                type: 'completed',
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
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not completed');
        await this.completed.schema.multiRevoke(signer, [
            {
                schemaId: this.completed.schema.uid,
                uid: this.completed.uid,
            },
        ]);
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
     * @inheritdoc
     */
    async attest(signer, callback) {
        this.assertPayload();
        const payload = await this.multiAttestPayload();
        const uids = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]), callback);
        uids.forEach((uid, index) => {
            payload[index][0].uid = uid;
        });
        console.log(uids);
    }
    /**
     * Attest the status of the milestone as approved, rejected or completed.
     */
    async attestStatus(signer, schema, callback) {
        const eas = this.schema.gap.eas.connect(signer);
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
            if (callback)
                callback('pending');
            const uid = await tx.wait();
            if (callback)
                callback('completed');
            console.log(uid);
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', error.message);
        }
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const milestone = new Milestone({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema('Milestone', consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.completed) {
                milestone.completed = new attestations_1.MilestoneCompleted({
                    ...attestation.completed,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema('MilestoneCompleted', consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.approved) {
                milestone.approved = new attestations_1.MilestoneCompleted({
                    ...attestation.approved,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema('MilestoneCompleted', consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.rejected) {
                milestone.rejected = new attestations_1.MilestoneCompleted({
                    ...attestation.rejected,
                    data: {
                        ...attestation.completed.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema('MilestoneCompleted', consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
            }
            if (attestation.verified?.length > 0) {
                milestone.verified = attestation.verified.map(m => new attestations_1.MilestoneCompleted({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema('MilestoneCompleted', consts_1.chainIdToNetwork[attestation.chainID]),
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
    async verify(signer, reason = '', callback) {
        console.log('Verifying');
        if (!this.completed)
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Milestone is not completed');
        const schema = this.schema.gap.findSchema('MilestoneCompleted');
        schema.setValue('type', 'verified');
        schema.setValue('reason', reason);
        console.log('Before attestStatus');
        await this.attestStatus(signer, schema, callback);
        console.log('After attestStatus');
        this.verified.push(new attestations_1.MilestoneCompleted({
            data: {
                type: 'verified',
                reason,
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
}
exports.Milestone = Milestone;
