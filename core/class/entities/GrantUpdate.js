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
exports.GrantUpdate = exports.GrantUpdateStatus = void 0;
const unified_types_1 = require("../../utils/unified-types");
const consts_1 = require("../../../core/consts");
const AllGapSchemas_1 = require("../AllGapSchemas");
const Attestation_1 = require("../Attestation");
const SchemaError_1 = require("../SchemaError");
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
    /**
     * Verify this GrantUpdate. If the GrantUpdate is not already verified,
     * it will throw an error.
     * @param signer
     * @param reason
     */
    async verify(signer, data, callback) {
        console.log("Verifying");
        const schema = this.schema.gap.findSchema("GrantUpdateStatus");
        if (this.schema.isJsonSchema()) {
            schema.setValue("json", JSON.stringify({
                type: "grant-update-verified",
                ...data,
            }));
        }
        else {
            schema.setValue("type", "grant-update-verified");
            schema.setValue("reason", data?.reason || "");
        }
        console.log("Before attest grant update verified");
        const { tx, uids } = await this.attestStatus(signer, schema, callback);
        console.log("After attest grant update verified");
        this.verified.push(new GrantUpdateStatus({
            data: {
                type: "grant-update-verified",
                ...data,
            },
            refUID: this.uid,
            schema: schema,
            recipient: this.recipient,
        }));
        return {
            tx,
            uids,
        };
    }
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const grantUpdate = new GrantUpdate({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("GrantUpdate", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.verified?.length > 0) {
                grantUpdate.verified = attestation.verified.map((m) => new GrantUpdateStatus({
                    ...m,
                    data: {
                        ...m.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("GrantUpdateStatus", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                }));
            }
            return grantUpdate;
        });
    }
}
exports.GrantUpdate = GrantUpdate;
