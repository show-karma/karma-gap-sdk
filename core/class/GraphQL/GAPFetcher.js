"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAPFetcher = void 0;
const Attestation_1 = require("../Attestation");
const gql_queries_1 = require("../../utils/gql-queries");
const attestations_1 = require("../types/attestations");
const GapSchema_1 = require("../GapSchema");
const Schema_1 = require("../Schema");
const EASClient_1 = require("./EASClient");
const SchemaError_1 = require("../SchemaError");
const entities_1 = require("../entities");
class GAPFetcher extends EASClient_1.EASClient {
    /**
     * Fetches all the schemas deployed by an owner
     * @param owner
     */
    async schemas(owner) {
        const query = gql_queries_1.gqlQueries.schemata(owner);
        const { schemata } = await this.query(query);
        return schemata.map((schema) => new GapSchema_1.GapSchema({
            name: "",
            schema: Schema_1.Schema.rawToObject(schema.schema),
            uid: schema.uid,
        }));
    }
    /**
     * Fetch a single attestation by its UID.
     * @param uid
     */
    async attestation(uid) {
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        return Attestation_1.Attestation.fromInterface([attestation])[0];
    }
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param search if set, will search decodedDataJson by the value.
     * @returns
     */
    async attestations(schemaName, search) {
        const schema = GapSchema_1.GapSchema.find(schemaName);
        const query = gql_queries_1.gqlQueries.attestationsOf(schema.uid, search);
        const { schema: { attestations }, } = await this.query(query);
        return attestations;
    }
    /**
     * Fetch attestations of a schema.
     * @param schemaName
     * @param recipient
     * @returns
     */
    async attestationsOf(schemaName, recipient) {
        const schema = GapSchema_1.GapSchema.find(schemaName);
        const query = gql_queries_1.gqlQueries.attestationsOf(schema.uid, recipient);
        const { schema: { attestations }, } = await this.query(query);
        return attestations;
    }
    /**
     * Fetch attestations of a schema for a specific recipient.
     * @param schemaName
     * @param recipient
     * @returns
     */
    async attestationsTo(schemaName, recipient) {
        const schema = GapSchema_1.GapSchema.find(schemaName);
        const query = gql_queries_1.gqlQueries.attestationsTo(schema.uid, recipient);
        const { schema: { attestations }, } = await this.query(query);
        return attestations;
    }
    /**
     * Fetch all dependent attestations of a parent schema.
     * @param parentSchema the schema name to get dependents of.
     * @param parentUid the parent uid to get dependents of.
     */
    async dependentsOf(parentSchema, parentUid) {
        const parent = GapSchema_1.GapSchema.find(parentSchema);
        const children = parent.children.map((c) => c.uid);
        if (!children.length)
            throw new SchemaError_1.SchemaError("INVALID_REFERENCE", `Schema ${parentSchema} has no children.`);
        const query = gql_queries_1.gqlQueries.dependentsOf(parentUid, children);
        const { attestations } = await this.query(query);
        return Attestation_1.Attestation.fromInterface(attestations);
    }
    /**
     * Fetch all available communities with details and grantees uids.
     *
     * If search is defined, will try to find communities by the search string.
     * @param search
     * @returns
     */
    async communities(search) {
        const [community, communityDetails, project] = GapSchema_1.GapSchema.findMany([
            "Community",
            "CommunityDetails",
            "Project",
        ]);
        const query = gql_queries_1.gqlQueries.attestationsOf(community.uid, search);
        const { schema: { attestations }, } = await this.query(query);
        const communities = Attestation_1.Attestation.fromInterface(attestations);
        if (!communities.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(communities.map((c) => c.uid), [project.uid, communityDetails.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        return communities.map((community) => {
            const refs = deps.filter((ref) => ref.refUID === community.uid);
            community.projects = (refs.filter((ref) => ref.schema.uid === project.uid && ref.refUID === community.uid));
            community.details = (refs.find((ref) => ref.schema.uid === communityDetails.uid &&
                ref.refUID === community.uid));
            return community;
        });
    }
    /**
     * Fetch a community by its id. This method will also return the
     * community details and projects.
     */
    async communityById(uid) {
        const [communityDetails, project] = GapSchema_1.GapSchema.findMany([
            "CommunityDetails",
            "Project",
        ]);
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        const communities = Attestation_1.Attestation.fromInterface([attestation]);
        if (!communities.length)
            throw new Error("Community not found.");
        const ref = gql_queries_1.gqlQueries.dependentsOf(communities.map((c) => c.uid), [project.uid, communityDetails.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        const communityAttestation = communities[0];
        communityAttestation.projects = (deps.filter((ref) => ref.schema.uid === project.uid &&
            ref.refUID === communityAttestation.uid));
        communityAttestation.projects = await this.projectsDetails(communityAttestation.projects);
        communityAttestation.details = (deps.find((ref) => ref.schema.uid === communityDetails.uid &&
            ref.refUID === communityAttestation.uid));
        return communityAttestation;
    }
    /**
     * Fetch the details for a set of
     * projects with project grants,
     * members, milestones, and tags.
     * @param projects
     */
    async projectsDetails(projects) {
        // Get projects array and fetch details, members, grants, etc then append to the project and return the array.
        const [projectDetails, tag, externalLink] = GapSchema_1.GapSchema.findMany([
            "ProjectDetails",
            "Tag",
            "ExternalLink",
        ]);
        const refQuery = gql_queries_1.gqlQueries.dependentsOf(projects.map((p) => p.uid), [projectDetails.uid, tag.uid, externalLink.uid]);
        const [result, members, grants] = await Promise.all([
            this.query(refQuery),
            this.membersOf(projects),
            this.grantsFor(projects),
        ]);
        const deps = Attestation_1.Attestation.fromInterface(result.attestations || []);
        return projects.map((project) => {
            project.details = (deps.find((ref) => ref.schema.uid === projectDetails.uid && ref.refUID === project.uid));
            if (project.details) {
                project.details.links = (deps.filter((ref) => ref.schema.uid === externalLink.uid));
            }
            project.tags = (deps.filter((ref) => ref.schema.uid === tag.uid && ref.refUID === project.uid));
            project.members = members.filter((m) => m.refUID === project.uid);
            project.grants = grants.filter((g) => g.refUID === project.uid);
            return project;
        });
    }
    /**
     * Fetch a project by its id.
     * @param uid
     * @returns
     */
    async projectById(uid) {
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        const projectAttestation = Attestation_1.Attestation.fromInterface([
            attestation,
        ])[0];
        const [result] = await this.projectsDetails([projectAttestation]);
        return result;
    }
    /**
     * Fetch projects with details and members.
     * @param name if set, will search by the name.
     * @returns
     */
    async projects(name) {
        const result = await this.attestations("Project", name);
        if (!result.length)
            return [];
        const projects = Attestation_1.Attestation.fromInterface(result);
        return this.projectsDetails(projects);
    }
    /**
     * Fetch projects with details and members.
     * @param grantee the public address of the grantee
     * @returns
     */
    async projectsOf(grantee) {
        const result = await this.attestationsTo("Project", grantee);
        if (!result.length)
            return [];
        const projects = Attestation_1.Attestation.fromInterface(result);
        return this.projectsDetails(projects);
    }
    /**
     * Fetch Grantee with details and projects.
     * @param address
     * @param withProjects if true, will get grantee project details.
     * @returns
     */
    async grantee(address) {
        const projects = await this.projectsOf(address);
        return new attestations_1.Grantee(address, projects);
    }
    /**
     * Fetch all Grantees with details.
     * @returns
     */
    async grantees() {
        const projects = await this.projects();
        return projects.reduce((acc, item) => {
            const hasGrantee = acc.find((g) => g.address === item.recipient);
            if (hasGrantee)
                hasGrantee.projects.push(item);
            else
                acc.push(new attestations_1.Grantee(item.recipient, [item]));
            return acc;
        }, []);
    }
    /**
     * Fetches the grantes related to a grantee address (recipient).
     * @param grantee
     * @returns
     */
    async grantsOf(grantee) {
        const [grant, grantDetails, grantVerified, grantRound] = GapSchema_1.GapSchema.findMany(["Grant", "GrantDetails", "GrantVerified", "GrantRound"]);
        const query = gql_queries_1.gqlQueries.attestationsTo(grant.uid, grantee);
        const { schema: { attestations }, } = await this.query(query);
        const grants = Attestation_1.Attestation.fromInterface(attestations);
        if (!grants.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [grantDetails.uid, grantVerified.uid, grantRound.uid], grants.map((g) => g.recipient));
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        const milestones = await this.milestonesOf(grants);
        return grants.map((grant) => {
            const refs = deps.filter((ref) => ref.refUID === grant.uid);
            grant.round = (refs.find((ref) => ref.schema.uid === grantRound.uid && ref.refUID === grant.uid));
            grant.verified = !!refs.find((ref) => ref.schema.uid === grantVerified.uid && ref.refUID === grant.uid);
            grant.details = (refs.find((ref) => ref.schema.uid === grantDetails.uid && ref.refUID === grant.uid));
            grant.milestones = milestones.filter((m) => m.refUID === grant.uid);
            return grant;
        });
    }
    /**
     * Fetch grants for an array of projects with milestones.
     * @param projects
     * @returns
     */
    async grantsFor(projects) {
        const [grant, grantDetails, milestone, milestoneApproved, milestoneCompleted,] = GapSchema_1.GapSchema.findMany([
            "Grant",
            "GrantDetails",
            "Milestone",
            "MilestoneApproved",
            "MilestoneCompleted",
        ]);
        const query = gql_queries_1.gqlQueries.dependentsOf(projects.map((p) => p.uid), [grant.uid]);
        const { attestations: grants } = await this.query(query);
        const grantsWithDetails = Attestation_1.Attestation.fromInterface(grants).map((g) => new entities_1.Grant(g));
        const ref = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [
            grantDetails.uid,
            milestone.uid,
            milestoneApproved.uid,
            milestoneCompleted.uid,
        ]);
        const { attestations } = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(attestations);
        grantsWithDetails.forEach((grant) => {
            grant.details = (deps.find((d) => d.refUID === grant.uid &&
                d.schema.uid === grantDetails.uid &&
                Array.isArray(d.assetAndChainId)));
            grant.milestones = deps
                .filter((d) => d.refUID === grant.uid &&
                d.schema.uid === milestone.uid &&
                d.uid !== grant.details?.uid)
                .map((milestone) => {
                const refs = deps.filter((ref) => ref.refUID === milestone.uid);
                const startsAt = milestone.startsAt;
                const endsAt = milestone.endsAt;
                milestone.startsAt = Number(startsAt);
                milestone.endsAt = Number(endsAt);
                const approvals = refs.filter((ref) => ref.schema.uid === milestoneApproved.uid &&
                    ref.refUID === milestone.uid);
                milestone.completed = approvals.length === 1;
                milestone.approved = approvals.length === 2;
                return milestone;
            });
        });
        return grantsWithDetails;
    }
    /**
     * Fetch projects by related tag names.
     * @param names
     * @returns
     */
    async projectsByTags(names) {
        const [tag, project] = GapSchema_1.GapSchema.findMany(["Tag", "Project"]);
        const query = gql_queries_1.gqlQueries.attestationsOf(tag.uid);
        const { schema: { attestations }, } = await this.query(query);
        const tags = Attestation_1.Attestation.fromInterface(attestations).filter((t) => names.includes(t.name));
        if (!tags.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(tags.map((t) => t.uid), [project.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        return deps.filter((ref) => ref.schema.uid === project.uid);
    }
    /**
     * Fetch all milestones related to an array of Grants.
     * @param grants
     * @returns
     */
    async milestonesOf(grants) {
        const [milestone, milestoneApproved, milestoneCompleted] = GapSchema_1.GapSchema.findMany([
            "Milestone",
            "MilestoneApproved",
            "MilestoneCompleted",
        ]);
        const query = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [milestone.uid]);
        const { attestations } = await this.query(query);
        const milestones = Attestation_1.Attestation.fromInterface(attestations);
        if (!milestones.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(milestones.map((m) => m.uid), [milestoneApproved.uid, milestoneCompleted.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        return milestones.map((milestone) => {
            const refs = deps.filter((ref) => ref.refUID === milestone.uid);
            milestone.approved = !!refs.find((ref) => ref.schema.uid === milestoneApproved.uid &&
                ref.refUID === milestone.uid);
            milestone.completed = !!refs.find((ref) => ref.schema.uid === milestoneCompleted.uid &&
                ref.refUID === milestone.uid);
            return milestone;
        });
    }
    /**
     * Bulk fetch members with details of an array of Projects.
     * @param projects
     * @returns
     */
    async membersOf(projects) {
        const [member, memberDetails] = GapSchema_1.GapSchema.findMany([
            "MemberOf",
            "MemberDetails",
        ]);
        if (!projects.length)
            return [];
        const query = gql_queries_1.gqlQueries.dependentsOf(projects.map((p) => p.uid), [member.uid], projects.map((p) => p.attester));
        const results = await this.query(query);
        const members = Attestation_1.Attestation.fromInterface(results.attestations || []);
        if (members.length) {
            const ref = gql_queries_1.gqlQueries.dependentsOf(members.map((a) => a.uid), [memberDetails.uid], members.map((a) => a.attester));
            const detailsResult = await this.query(ref);
            const detailsRef = Attestation_1.Attestation.fromInterface(detailsResult.attestations || []);
            members.forEach((member) => {
                member.details = detailsRef.find((d) => d.refUID === member.uid);
            });
        }
        return members;
    }
}
exports.GAPFetcher = GAPFetcher;