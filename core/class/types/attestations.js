"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantCompleted = exports.GrantUpdate = exports.Grantee = exports.ProjectDetails = exports.Tag = exports.MilestoneCompleted = exports.MemberDetails = exports.GrantVerified = exports.GrantRound = exports.GrantDetails = exports.CommunityDetails = void 0;
const Attestation_1 = require("../Attestation");
class CommunityDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.links = [];
    }
}
exports.CommunityDetails = CommunityDetails;
class GrantDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.type = 'grant-details';
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
class GrantUpdate extends Attestation_1.Attestation {
}
exports.GrantUpdate = GrantUpdate;
class GrantCompleted extends GrantUpdate {
}
exports.GrantCompleted = GrantCompleted;
