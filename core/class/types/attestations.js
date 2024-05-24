"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectEndorsement = exports.GrantCompleted = exports.Grantee = exports.ProjectDetails = exports.Tag = exports.MilestoneCompleted = exports.MemberDetails = exports.GrantVerified = exports.GrantRound = exports.GrantDetails = exports.CommunityDetails = void 0;
const Attestation_1 = require("../Attestation");
const GrantUpdate_1 = require("../entities/GrantUpdate");
const SchemaError_1 = require("../SchemaError");
class CommunityDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.links = [];
        this.type = "community-details";
    }
}
exports.CommunityDetails = CommunityDetails;
class GrantDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.type = "grant-details";
    }
}
exports.GrantDetails = GrantDetails;
class GrantRound extends Attestation_1.Attestation {
}
exports.GrantRound = GrantRound;
class GrantVerified extends Attestation_1.Attestation {
}
exports.GrantVerified = GrantVerified;
class MemberDetails extends Attestation_1.Attestation {
}
exports.MemberDetails = MemberDetails;
class MilestoneCompleted extends Attestation_1.Attestation {
}
exports.MilestoneCompleted = MilestoneCompleted;
class Tag extends Attestation_1.Attestation {
}
exports.Tag = Tag;
class ProjectDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.links = [];
        this.tags = [];
        this.type = "project-details";
        this.externalIds = [];
    }
    async attest(signer, callback) {
        console.log("Attesting community");
        try {
            callback?.("preparing");
            this._uid = await this.schema.attest({
                data: this.data,
                to: this.recipient,
                refUID: this.refUID,
                signer,
            });
            callback?.("pending");
            callback?.("confirmed");
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.");
        }
    }
}
exports.ProjectDetails = ProjectDetails;
class Grantee {
    constructor(address, projects = []) {
        this.projects = [];
        this.address = address;
        this.projects = projects;
    }
}
exports.Grantee = Grantee;
class GrantCompleted extends GrantUpdate_1.GrantUpdate {
}
exports.GrantCompleted = GrantCompleted;
class ProjectEndorsement extends Attestation_1.Attestation {
    constructor(data) {
        data.data.type = "project-endorsement";
        super(data);
    }
    async attest(signer, callback) {
        console.log("Attesting project endorsement");
        try {
            callback?.("preparing");
            this._uid = await this.schema.attest({
                data: this.data,
                to: this.recipient,
                refUID: this.refUID,
                signer,
            });
            callback?.("confirmed");
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.");
        }
    }
}
exports.ProjectEndorsement = ProjectEndorsement;
