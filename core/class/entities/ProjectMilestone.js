"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectObjective = exports.ProjectObjectiveStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
class ProjectObjectiveStatus extends Attestation_1.Attestation {
}
exports.ProjectObjectiveStatus = ProjectObjectiveStatus;
class ProjectObjective extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.verified = [];
    }
    /**
     * Attest the status of the update as approved, rejected or completed.
     */
    async attestObjective(signer, schema, callback) {
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
        const schema = this.schema.gap.findSchema("ProjectObjectiveStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "verified",
                reason: data?.reason || "",
            }));
        }
        else {
            schema.setValue("type", "project-objective-verified");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest project objective verified");
        await this.attestObjective(signer, schema, callback);
        console.log("After attest project objective verified");
        this.verified.push(new ProjectObjectiveStatus({
            data: {
                type: "project-objective-verified",
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const projectUpdate = new ProjectObjective({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectObjective", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                projectUpdate.verified = attestation.verified.map((m) => new ProjectObjectiveStatus({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectObjectiveStatus", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return projectUpdate;
        });
    }
}
exports.ProjectObjective = ProjectObjective;
