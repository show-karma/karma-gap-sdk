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
     * Verify this ProjectImpact. If the ProjectImpact is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, data, callback) {
        console.log("Verifying ProjectImpact");
        const schema = this.schema.gap.findSchema("GrantUpdateStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "project-impact-verified",
                reason: data?.reason || '',
            }));
        }
        else {
            schema.setValue("type", "project-impact-verified");
            schema.setValue("reason", data?.reason || '');
        }
        console.log("Before attest project impact verified");
        const { tx, uids } = await this.attestStatus(signer, schema, callback);
        console.log("After attest project impact verified");
        this.verified.push(new ProjectImpactStatus({
            data: {
                type: "project-impact-verified",
                reason: data?.reason || '',
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
        return { tx, uids };
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const projectImpact = new ProjectImpact({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectImpact", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                projectImpact.verified = attestation.verified.map((m) => new ProjectImpactStatus({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("GrantUpdateStatus", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return projectImpact;
        });
    }
}
exports.ProjectImpact = ProjectImpact;
