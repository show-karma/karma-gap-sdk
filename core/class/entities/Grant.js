"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grant = void 0;
const Attestation_1 = require("../Attestation");
const attestations_1 = require("../types/attestations");
const Milestone_1 = require("./Milestone");
const GapSchema_1 = require("../GapSchema");
const GAP_1 = require("../GAP");
const SchemaError_1 = require("../SchemaError");
const consts_1 = require("../../consts");
const GapContract_1 = require("../contract/GapContract");
const Community_1 = require("./Community");
class Grant extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = false;
        this.milestones = [];
        this.updates = [];
        this.members = [];
    }
    async verify(signer) {
        const eas = GAP_1.GAP.eas.connect(signer);
        const schema = GapSchema_1.GapSchema.find('MilestoneApproved');
        schema.setValue('approved', true);
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
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', error.message);
        }
    }
    /**
     * Add milestones to the grant.
     * @param signer
     * @param milestones
     */
    addMilestones(milestones) {
        const schema = GapSchema_1.GapSchema.find('Milestone');
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
    async multiAttestPayload(currentPayload = [], projectIdx = 0) {
        this.assertPayload();
        const payload = [...currentPayload];
        const grantIdx = payload.push([this, await this.payloadFor(projectIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, await this.details.payloadFor(grantIdx)]);
        }
        if (this.milestones.length) {
            await Promise.all(this.milestones.map(async (m) => payload.push([m, await m.payloadFor(grantIdx)])));
        }
        if (this.updates.length) {
            await Promise.all(this.updates.map(async (u) => payload.push([u, await u.payloadFor(grantIdx)])));
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    /**
     * @inheritdoc
     */
    async attest(signer) {
        this.assertPayload();
        const payload = await this.multiAttestPayload();
        const uids = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]));
        uids.forEach((uid, index) => {
            payload[index][0].uid = uid;
        });
        console.log(uids);
    }
    async attestUpdate(signer, data) {
        const grantUpdate = new attestations_1.GrantUpdate({
            data: {
                ...data,
                type: 'grant-update',
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: GapSchema_1.GapSchema.find('GrantDetails'),
        });
        await grantUpdate.attest(signer);
        this.updates.push(grantUpdate);
    }
    async complete(signer, data) {
        const completed = new attestations_1.GrantCompleted({
            data: {
                ...data,
                type: 'grant-completed',
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: GapSchema_1.GapSchema.find('GrantDetails'),
        });
        await completed.attest(signer);
        this.completed = completed;
    }
    /**
     * Validate if the grant has a valid reference to a community.
     */
    assertPayload() {
        if (!this.details || !this.communityUID) {
            throw new SchemaError_1.AttestationError('INVALID_REFERENCE', 'Grant should include a valid reference to a community on its details.');
        }
        return true;
    }
    static from(attestations) {
        return attestations.map((attestation) => {
            const grant = new Grant({
                ...attestation,
                data: {
                    communityUID: attestation.data.communityUID,
                },
                schema: GapSchema_1.GapSchema.find('Grant'),
            });
            if (attestation.details) {
                const { details } = attestation;
                grant.details = new attestations_1.GrantDetails({
                    ...details,
                    data: {
                        ...details.data,
                    },
                    schema: GapSchema_1.GapSchema.find('GrantDetails'),
                });
            }
            if (attestation.milestones) {
                const { milestones } = attestation;
                grant.milestones = Milestone_1.Milestone.from(milestones);
            }
            if (attestation.updates) {
                const { updates } = attestation;
                grant.updates = updates.map((u) => new attestations_1.GrantUpdate({
                    ...u,
                    data: {
                        ...u.data,
                    },
                    schema: GapSchema_1.GapSchema.find('GrantDetails'),
                }));
            }
            if (attestation.completed) {
                const { completed } = attestation;
                grant.completed = new attestations_1.GrantCompleted({
                    ...completed,
                    data: {
                        ...completed.data,
                    },
                    schema: GapSchema_1.GapSchema.find('GrantDetails'),
                });
            }
            if (attestation.project) {
                const { project } = attestation;
                grant.project = project;
            }
            if (attestation.community) {
                const { community } = attestation;
                grant.community = Community_1.Community.from([community])[0];
            }
            if (attestation.members) {
                grant.members = attestation.members;
            }
            return grant;
        });
    }
}
exports.Grant = Grant;
