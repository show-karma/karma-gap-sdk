"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantUpdate = exports.GrantUpdateStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
class GrantUpdateStatus extends Attestation_1.Attestation {
}
exports.GrantUpdateStatus = GrantUpdateStatus;
class GrantUpdate extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = [];
    }
    /**
     * Attest the status of the milestone as approved, rejected or completed.
     */
    async attestStatus(signer, schema) {
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
            const uid = await tx.wait();
            console.log(uid);
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', error.message);
        }
    }
    /**
     * Verify this GrantUpdate. If the GrantUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, reason = '') {
        console.log('Verifying');
        const schema = this.schema.gap.findSchema('GrantUpdateStatus');
        schema.setValue('type', 'grant-update-verified');
        schema.setValue('reason', reason);
        console.log('Before attest grant update verified');
        await this.attestStatus(signer, schema);
        console.log('After attest grant update verified');
        this.verified.push(new GrantUpdateStatus({
            data: {
                type: 'grant-update-verified',
                reason,
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const grantUpdate = new GrantUpdate({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema('GrantUpdate', consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                grantUpdate.verified = attestation.verified.map(m => new GrantUpdateStatus({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema('GrantUpdateStatus', consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return grantUpdate;
        });
    }
}
exports.GrantUpdate = GrantUpdate;
