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
exports.ProjectUpdate = exports.ProjectUpdateStatus = void 0;
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
const unified_types_1 = require("../../utils/unified-types");
class ProjectUpdateStatus extends Attestation_1.Attestation {
}
exports.ProjectUpdateStatus = ProjectUpdateStatus;
class ProjectUpdate extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
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
        const schema = this.schema.gap.findSchema("ProjectUpdateStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "verified",
                reason: data?.reason || "",
            }));
        }
        else {
            schema.setValue("type", "project-update-verified");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest project update verified");
        await this.attestStatus(signer, schema, callback);
        console.log("After attest project update verified");
        this.verified.push(new ProjectUpdateStatus({
            data: {
                type: "project-update-verified",
                reason: data?.reason || "",
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const projectUpdate = new ProjectUpdate({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectUpdate", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                projectUpdate.verified = attestation.verified.map((m) => new ProjectUpdateStatus({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectUpdateStatus", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return projectUpdate;
        });
    }
}
exports.ProjectUpdate = ProjectUpdate;
