"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const Attestation_1 = require("../Attestation");
const attestations_1 = require("../types/attestations");
const SchemaError_1 = require("../SchemaError");
const utils_1 = require("../../utils");
const Grant_1 = require("./Grant");
const consts_1 = require("../../consts");
const MemberOf_1 = require("./MemberOf");
const GapContract_1 = require("../contract/GapContract");
const AllGapSchemas_1 = require("../AllGapSchemas");
const ProjectImpact_1 = require("./ProjectImpact");
const ProjectUpdate_1 = require("./ProjectUpdate");
const ProjectPointer_1 = require("./ProjectPointer");
const ProjectMilestone_1 = require("./ProjectMilestone");
class Project extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.members = [];
        this.grants = [];
        this.impacts = [];
        this.endorsements = [];
        this.updates = [];
        this.pointers = [];
        this.milestones = [];
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
    async multiAttestPayload(currentPayload = [], communityIdx = 0) {
        const payload = [...currentPayload];
        const projectIdx = payload.push([this, await this.payloadFor(communityIdx)]) - 1;
        if (this.details) {
            payload.push([this.details, await this.details.payloadFor(projectIdx)]);
        }
        if (this.members?.length) {
            await Promise.all(this.members.map(async (m) => payload.push(...(await m.multiAttestPayload(payload, projectIdx)))));
        }
        if (this.grants?.length) {
            await Promise.all(this.grants.map(async (g) => payload.push(...(await g.multiAttestPayload(payload, projectIdx)))));
        }
        return payload.slice(currentPayload.length, payload.length);
    }
    async attest(signer, callback) {
        const payload = await this.multiAttestPayload();
        const { tx, uids } = await GapContract_1.GapContract.multiAttest(signer, payload.map((p) => p[1]), callback);
        if (Array.isArray(uids)) {
            uids.forEach((uid, index) => {
                payload[index][0].uid = uid;
            });
        }
        return { tx, uids };
    }
    async transferOwnership(signer, newOwner, callback) {
        callback?.("preparing");
        const tx = await GapContract_1.GapContract.transferProjectOwnership(signer, this.uid, newOwner);
        callback?.("confirmed");
        const txArray = [tx].flat();
        return { tx: txArray, uids: [this.uid] };
    }
    isOwner(signer) {
        return GapContract_1.GapContract.isProjectOwner(signer, this.uid, this.chainID);
    }
    /**
     * Add new members to the project.
     * If any member in the array already exists in the project
     * it'll be ignored.
     * @param members
     */
    pushMembers(...members) {
        this.members.push(...(0, utils_1.mapFilter)(members, (member) => !!this.members.find((m) => m.recipient === member), (member) => new MemberOf_1.MemberOf({
            data: { memberOf: true },
            refUID: this.uid,
            schema: this.schema.gap.findSchema("MemberOf"),
            recipient: member,
            uid: consts_1.nullRef,
        })));
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
    async attestMembers(signer, members, callback) {
        const newMembers = (0, utils_1.mapFilter)(members, (member) => !this.members.find((m) => m.recipient === member.recipient), 
        // (member) => !!member,
        (details) => {
            const member = new MemberOf_1.MemberOf({
                data: { memberOf: true },
                refUID: this.uid,
                schema: this.schema.gap.findSchema("MemberOf"),
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
        const { uids: attestedMembers } = await this.schema.multiAttest(signer, newMembers.map((m) => m.member), callback);
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
    async addMemberDetails(signer, entities, callback) {
        // Check if any of members should be revoked (details modified)
        const toRevoke = (0, utils_1.mapFilter)(this.members, (member) => !!entities.find((entity) => member.uid === entity.refUID &&
            member.details &&
            member.details?.refUID !== entity.refUID), (member) => member.uid);
        if (toRevoke.length) {
            console.log("Revoking details");
            await this.cleanDetails(signer, toRevoke);
        }
        console.log(`Creating ${entities.length} new member details`);
        const { uids: attestedEntities } = await this.schema.multiAttest(signer, entities, callback);
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
        const memberDetails = this.schema.gap.findSchema("MemberDetails");
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
        const memberOf = this.schema.gap.findSchema("MemberOf");
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
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const project = new Project({
                ...attestation,
                data: {
                    project: true,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("Project", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            if (attestation.details) {
                const { details } = attestation;
                project.details = new attestations_1.ProjectDetails({
                    ...details,
                    data: {
                        ...details.data,
                    },
                    schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectDetails", consts_1.chainIdToNetwork[attestation.chainID]),
                    chainID: attestation.chainID,
                });
                project.details.links = details.data.links || [];
                project.details.tags = details.data.tags || [];
                if (attestation.data.links) {
                    project.details.links = attestation.data.links;
                }
                if (attestation.data.tags) {
                    project.details.tags = attestation.tags;
                }
            }
            if (attestation.members) {
                project.members = attestation.members.map((m) => {
                    const member = new MemberOf_1.MemberOf({
                        ...m,
                        data: {
                            memberOf: true,
                        },
                        schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MemberOf", consts_1.chainIdToNetwork[attestation.chainID]),
                        chainID: attestation.chainID,
                    });
                    if (m.details) {
                        const { details } = m;
                        member.details = new attestations_1.MemberDetails({
                            ...details,
                            data: {
                                ...details.data,
                            },
                            schema: new AllGapSchemas_1.AllGapSchemas().findSchema("MemberDetails", consts_1.chainIdToNetwork[attestation.chainID]),
                            chainID: attestation.chainID,
                        });
                    }
                    return member;
                });
            }
            if (attestation.grants) {
                project.grants = Grant_1.Grant.from(attestation.grants, network);
            }
            if (attestation.impacts) {
                project.impacts = ProjectImpact_1.ProjectImpact.from(attestation.impacts, network);
            }
            if (attestation.pointers) {
                project.pointers = ProjectPointer_1.ProjectPointer.from(attestation.pointers, network);
            }
            if (attestation.updates) {
                project.updates = ProjectUpdate_1.ProjectUpdate.from(attestation.updates, network);
            }
            if (attestation.milestones) {
                project.milestones = ProjectMilestone_1.ProjectMilestone.from(attestation.updates, network);
            }
            if (attestation.endorsements) {
                project.endorsements = attestation.endorsements.map((pi) => {
                    const endorsement = new attestations_1.ProjectEndorsement({
                        ...pi,
                        data: {
                            ...pi.data,
                        },
                        schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectDetails", consts_1.chainIdToNetwork[attestation.chainID]),
                        chainID: attestation.chainID,
                    });
                    return endorsement;
                });
            }
            return project;
        });
    }
    async attestUpdate(signer, data, callback) {
        const projectUpdate = new ProjectUpdate_1.ProjectUpdate({
            data: {
                ...data,
                type: "project-update",
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: this.schema.gap.findSchema("ProjectUpdate"),
        });
        await projectUpdate.attest(signer, callback);
        this.updates.push(projectUpdate);
    }
    async attestMilestone(signer, data, callback) {
        const projectMilestone = new ProjectMilestone_1.ProjectMilestone({
            data: {
                ...data,
                type: "project-milestone",
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: this.schema.gap.findSchema("ProjectMilestone"),
        });
        await projectMilestone.attest(signer, callback);
        this.milestones.push(projectMilestone);
    }
    async attestPointer(signer, data, callback) {
        const projectPointer = new ProjectPointer_1.ProjectPointer({
            data: {
                ...data,
                type: "project-pointer",
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: this.schema.gap.findSchema("ProjectPointer"),
        });
        await projectPointer.attest(signer, callback);
        this.pointers.push(projectPointer);
    }
    async attestImpact(signer, data, targetChainId, callback) {
        if (targetChainId && targetChainId !== this.chainID) {
            return this.attestGhostProjectImpact(signer, data, targetChainId, callback);
        }
        const projectImpact = new ProjectImpact_1.ProjectImpact({
            data: {
                ...data,
                type: "project-impact",
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: this.schema.gap.findSchema("ProjectDetails"),
        });
        const { tx, uids } = await projectImpact.attest(signer, callback);
        this.impacts.push(projectImpact);
        return { tx, uids };
    }
    async attestGhostProjectImpact(signer, data, targetChainId, callback) {
        const { tx, uids } = await this.attestGhostProject(signer, targetChainId);
        const ghostProjectUid = uids[0];
        const allGapSchemas = new AllGapSchemas_1.AllGapSchemas();
        const projectImpact = new ProjectImpact_1.ProjectImpact({
            data: {
                ...data,
                type: "project-impact",
            },
            recipient: this.recipient,
            refUID: ghostProjectUid,
            schema: allGapSchemas.findSchema("ProjectDetails", consts_1.chainIdToNetwork[targetChainId]),
            chainID: targetChainId,
        });
        const impactAttestation = await projectImpact.attest(signer, callback);
        this.impacts.push(projectImpact);
        return {
            tx: impactAttestation.tx,
            uids: [...uids, impactAttestation.uids[0]],
        };
    }
    async attestEndorsement(signer, data) {
        const projectEndorsement = new attestations_1.ProjectEndorsement({
            data: {
                ...data,
                type: "project-endorsement",
            },
            recipient: this.recipient,
            refUID: this.uid,
            schema: this.schema.gap.findSchema("ProjectDetails"),
        });
        await projectEndorsement.attest(signer);
        this.endorsements.push(projectEndorsement);
    }
    async attestGhostProject(signer, targetChainId) {
        const allGapSchemas = new AllGapSchemas_1.AllGapSchemas();
        const project = new Project({
            data: { project: true },
            schema: allGapSchemas.findSchema("Project", consts_1.chainIdToNetwork[targetChainId]),
            recipient: this.recipient,
            chainID: targetChainId,
        });
        project.details = new Attestation_1.Attestation({
            data: {
                originalProjectChainId: this.chainID,
                uid: this.uid,
            },
            chainID: targetChainId,
            recipient: this.recipient,
            schema: allGapSchemas.findSchema("ProjectDetails", consts_1.chainIdToNetwork[targetChainId]),
        });
        const attestation = await project.attest(signer);
        return attestation;
    }
}
exports.Project = Project;
