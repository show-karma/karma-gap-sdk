"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectImpact = exports.ProjectImpactStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../consts");
class ProjectImpactStatus extends Attestation_1.Attestation {
}
exports.ProjectImpactStatus = ProjectImpactStatus;
class ProjectImpact extends Attestation_1.Attestation {
    constructor(data) {
        data.data.type = "project-impact";
        super(data);
        this.verified = [];
    }
    /**
     * Attest Project Impact.
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
     * Verify this ProjectImpact. If the ProjectImpact is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, reason = '') {
        console.log('Verifying ProjectImpact');
        const schema = this.schema.gap.findSchema('GrantUpdateStatus');
        schema.setValue('type', 'project-impact-verified');
        schema.setValue('reason', reason);
        console.log('Before attest project impact verified');
        await this.attestStatus(signer, schema);
        console.log('After attest project impact verified');
        this.verified.push(new ProjectImpactStatus({
            data: {
                type: 'project-impact-verified',
                reason,
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const grantUpdate = new ProjectImpact({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema('ProjectImpact', consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                grantUpdate.verified = attestation.verified.map(m => new ProjectImpactStatus({
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
exports.ProjectImpact = ProjectImpact;
