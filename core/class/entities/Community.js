"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Community = void 0;
const Attestation_1 = require("../Attestation");
const attestations_1 = require("../types/attestations");
const consts_1 = require("../../consts");
const SchemaError_1 = require("../SchemaError");
const GapSchema_1 = require("../GapSchema");
class Community extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.projects = [];
    }
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    async attest(signer, details) {
        console.log("Attesting community");
        try {
            if (!this.uid || ["0x0", consts_1.nullRef].includes(this.uid)) {
                const uid = await this.schema.attest({
                    data: this.data,
                    to: this.recipient,
                    refUID: this.refUID,
                    signer,
                });
                this._uid = uid;
                console.log("Attested community with UID", this.uid);
            }
            else {
                console.log("Community already attested", this.uid);
            }
            if (this.details && ![consts_1.nullRef, "0x0"].includes(this.details.uid)) {
                this.details.setValues(details);
                const detailsId = await this.details.attest(signer);
                Object.assign(this.details, { uid: detailsId });
                return;
            }
            const detailsAttestation = new attestations_1.CommunityDetails({
                data: details,
                createdAt: Date.now(),
                recipient: this.recipient,
                refUID: this.uid,
                schema: GapSchema_1.GapSchema.find("CommunityDetails"),
                uid: consts_1.nullRef,
            });
            const detailsId = await detailsAttestation.attest(signer);
            Object.assign(detailsAttestation, { uid: detailsId });
            this.details = detailsAttestation;
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.");
        }
    }
}
exports.Community = Community;
