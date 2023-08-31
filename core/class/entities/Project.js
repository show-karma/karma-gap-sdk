"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const Attestation_1 = require("../Attestation");
const GapSchema_1 = require("../GapSchema");
const SchemaError_1 = require("../SchemaError");
const utils_1 = require("../../utils");
const consts_1 = require("../../consts");
const MemberOf_1 = require("./MemberOf");
const MultiAttest_1 = require("../contract/MultiAttest");
class Project extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.members = [];
        this.grants = [];
        this.tags = [];
    }
    /**
     * Creates the payload for a multi-attestation.
     *
     * > if Current payload is set, it'll be used as the base payload
     * and the project should refer to an index of the current payload,
     * usually the community position.
     *
     * @param payload
     * @param communityIdx
     */
    multiAttestPayload(currentPayload = [], communityIdx = 0) {
        const payload = [...currentPayload];
        const projectIdx = payload.push([this, this.payloadFor(communityIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, this.details.payloadFor(projectIdx)]);
            if (this.details.links?.length) {
                this.details.links.forEach((link) => {
                    payload.push([link, link.payloadFor(projectIdx)]);
                });
            }
        }
        if (this.members?.length) {
            this.members.forEach((m) => {
                payload.push(...m.multiAttestPayload(payload, projectIdx));
            });
        }
        if (this.grants?.length) {
            this.grants.forEach((g) => {
                payload.push(...g.multiAttestPayload(payload, projectIdx));
            });
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    async attest(signer) {
        if (!this.refUID)
            throw new SchemaError_1.AttestationError("INVALID_REF_UID", "Project must have a reference UID to a community.");
        const payload = this.multiAttestPayload();
        const uids = await MultiAttest_1.MultiAttest.send(signer, payload.map((p) => p[1]));
        uids.forEach((uid, index) => {
            payload[index][0].uid = uid;
        });
    }
    /**
     * Add new members to the project.
     * If any member in the array already exists in the project
     * it'll be ignored.
     *
     * __To modify member details, use `addMemberDetails(signer, MemberDetails[])` instead.__
     * @param signer
     * @param members
     */
    async addMembers(signer, members) {
        const newMembers = (0, utils_1.mapFilter)(members, (member) => !this.members.find((m) => m.recipient === member.recipient), 
        // (member) => !!member,
        (details) => {
            const member = new MemberOf_1.MemberOf({
                data: { memberOf: true },
                refUID: this.uid,
                schema: GapSchema_1.GapSchema.find("MemberOf"),
                createdAt: Date.now(),
                recipient: details.recipient,
                uid: consts_1.nullRef,
            });
            return { member, details };
        });
        if (!newMembers.length) {
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "No new members to add.");
        }
        console.log(`Creating ${newMembers.length} new members`);
        const attestedMembers = await this.schema.multiAttest(signer, newMembers.map((m) => m.member));
        console.log("attested-members", attestedMembers);
        newMembers.forEach(({ member, details }, idx) => {
            Object.assign(member, { uid: attestedMembers[idx] });
            if (!details)
                return;
            Object.assign(details, { refUID: attestedMembers[idx] });
        });
        this.members.push(...newMembers.map((m) => m.member));
        await this.addMemberDetails(signer, newMembers.map((m) => m.details));
    }
    /**
     * Add new details to the members of a project. Note that it will overwrite
     * any existing details.
     *
     * @param signer
     * @param entities
     */
    async addMemberDetails(signer, entities) {
        // Check if any of members should be revoked (details modified)
        const toRevoke = (0, utils_1.mapFilter)(this.members, (member) => !!entities.find((entity) => member.uid === entity.refUID &&
            member.details &&
            member.details?.refUID !== entity.refUID), (member) => member.uid);
        if (toRevoke.length) {
            console.log("Revoking details");
            await this.cleanDetails(signer, toRevoke);
        }
        console.log(`Creating ${entities.length} new member details`);
        const attestedEntities = (await this.schema.multiAttest(signer, entities));
        console.log("attested-entities", attestedEntities);
        entities.forEach((entity, idx) => {
            const member = this.members.find((member) => member.uid === entity.refUID);
            if (!member)
                return;
            Object.assign(entity, { uid: attestedEntities[idx] });
            member.details = entity;
        });
    }
    /**
     * Clean member details.
     * @param signer
     * @param uids
     */
    async cleanDetails(signer, uids) {
        if (!uids.length) {
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "No details to clean.");
        }
        const memberDetails = GapSchema_1.GapSchema.find("MemberDetails");
        await this.schema.multiRevoke(signer, uids.map((uid) => ({ schemaId: memberDetails.uid, uid })));
        this.members.forEach((member) => {
            if (!member.details)
                return;
            if (uids.includes(member.details.uid)) {
                member.details = undefined;
            }
        });
    }
    /**
     * Remove members from the project.
     * @param signer
     * @param uids
     * @returns
     */
    async removeMembers(signer, uids) {
        if (!uids.length) {
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "No members to remove.");
        }
        const memberOf = GapSchema_1.GapSchema.find("MemberOf");
        const details = (0, utils_1.mapFilter)(this.members, (m) => uids.includes(m.uid) && !!m.details, (m) => m.details?.uid);
        if (details.length) {
            await this.cleanDetails(signer, details);
        }
        await this.schema.multiRevoke(signer, uids.map((uid) => ({ schemaId: memberOf.uid, uid })));
        this.members = this.members.filter((m) => !uids.includes(m.uid));
    }
    /**
     * Remove all members from the project.
     * @param signer
     */
    async removeAllMembers(signer) {
        const members = (0, utils_1.mapFilter)(this.members, (m) => !!m.uid, (m) => m.uid);
        if (!members.length) {
            throw new SchemaError_1.AttestationError("REVOKATION_ERROR", "No members to revoke.");
        }
        const details = (0, utils_1.mapFilter)(this.members, (m) => !!m.details, (m) => m.details?.uid);
        if (details.length) {
            await this.cleanDetails(signer, details);
        }
        await this.removeMembers(signer, members);
        this.members.splice(0, this.members.length);
    }
}
exports.Project = Project;
