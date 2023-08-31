"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grantee = exports.ProjectDetails = exports.Tag = exports.MilestoneApproved = exports.MilestoneCompleted = exports.MemberOf = exports.MemberDetails = exports.GrantVerified = exports.GrantRound = exports.GrantDetails = exports.CommunityDetails = exports.ExternalLink = void 0;
const Attestation_1 = require("../Attestation");
class ExternalLink extends Attestation_1.Attestation {
}
exports.ExternalLink = ExternalLink;
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
        this.amount = "0";
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
class MemberOf extends Attestation_1.Attestation {
}
exports.MemberOf = MemberOf;
class MilestoneCompleted extends Attestation_1.Attestation {
}
exports.MilestoneCompleted = MilestoneCompleted;
class MilestoneApproved extends Attestation_1.Attestation {
}
exports.MilestoneApproved = MilestoneApproved;
class Tag extends Attestation_1.Attestation {
}
exports.Tag = Tag;
class ProjectDetails extends Attestation_1.Attestation {
    constructor() {
        super(...arguments);
        this.links = [];
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
