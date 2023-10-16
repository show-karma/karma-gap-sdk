"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapEasClient = void 0;
const Attestation_1 = require("../Attestation");
const gql_queries_1 = require("../../utils/gql-queries");
const to_unix_1 = require("../../utils/to-unix");
const attestations_1 = require("../types/attestations");
const GapSchema_1 = require("../GapSchema");
const Schema_1 = require("../Schema");
const SchemaError_1 = require("../SchemaError");
const entities_1 = require("../entities");
const Community_1 = require("../entities/Community");
const utils_1 = require("../../utils");
const Fetcher_1 = require("./Fetcher");
const consts_1 = require("../../consts");
// TODO: Split this class into small ones
class GapEasClient extends Fetcher_1.Fetcher {
    constructor(args) {
        const { network } = args;
        super(consts_1.Networks[network].url);
        this.network = { ...consts_1.Networks[network], name: network };
    }
    /**
     * Fetches all the schemas deployed by an owner
     * @param owner
     */
    async schemas(owner) {
        const query = gql_queries_1.gqlQueries.schemata(owner);
        const { schemata } = await this.query(query);
        return schemata.map((schema) => new GapSchema_1.GapSchema({
            name: '',
            schema: Schema_1.Schema.rawToObject(schema.schema),
            uid: schema.uid,
        }));
    }
    async attestation(uid) {
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        return Attestation_1.Attestation.fromInterface([attestation])[0];
    }
    async attestations(schemaName, search) {
        const schema = GapSchema_1.GapSchema.find(schemaName);
        const query = gql_queries_1.gqlQueries.attestationsOf(schema.uid, search);
        const { schema: { attestations }, } = await this.query(query);
        return attestations;
    }
    async attestationsOf(schemaName, recipient) {
        const schema = GapSchema_1.GapSchema.find(schemaName);
        const query = gql_queries_1.gqlQueries.attestationsOf(schema.uid, recipient);
        const { schema: { attestations }, } = await this.query(query);
        return attestations;
    }
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
            throw new SchemaError_1.SchemaError('INVALID_REFERENCE', `Schema ${parentSchema} has no children.`);
        const query = gql_queries_1.gqlQueries.dependentsOf(parentUid, children);
        const { attestations } = await this.query(query);
        return Attestation_1.Attestation.fromInterface(attestations);
    }
    async communities(search) {
        const [community, communityDetails] = GapSchema_1.GapSchema.findMany([
            'Community',
            'CommunityDetails',
        ]);
        const query = gql_queries_1.gqlQueries.attestationsOf(community.uid, search);
        const { schema: { attestations }, } = await this.query(query);
        const communities = Attestation_1.Attestation.fromInterface(attestations);
        if (!communities.length)
            return [];
        return this.communitiesDetails(communities);
    }
    async communitiesByIds(uids) {
        if (!uids.length)
            return [];
        const communityDetails = GapSchema_1.GapSchema.find('CommunityDetails');
        const communityQuery = gql_queries_1.gqlQueries.attestationsIn(uids);
        const detailsQuery = gql_queries_1.gqlQueries.dependentsOf(uids, [communityDetails.uid]);
        try {
            const [communities, details] = await Promise.all([
                this.query(communityQuery),
                this.query(detailsQuery),
            ]);
            const communitiesAttestations = Attestation_1.Attestation.fromInterface(communities.attestations || []);
            const detailsAttestations = Attestation_1.Attestation.fromInterface(details.attestations || []);
            communitiesAttestations.forEach((community) => {
                community.details = detailsAttestations.find((d) => d.refUID === community.uid);
            });
            return communitiesAttestations;
        }
        catch (error) {
            throw error;
        }
    }
    async communitiesDetails(communities) {
        const [project, communityDetails] = GapSchema_1.GapSchema.findMany([
            'Project',
            'CommunityDetails',
        ]);
        const ref = gql_queries_1.gqlQueries.dependentsOf(communities.map((c) => c.uid), [communityDetails.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        return communities.map((community) => {
            community.projects = (deps.filter((ref) => ref.schema.uid === project.uid && ref.refUID === community.uid));
            community.details = (deps.find((ref) => ref.schema.uid === communityDetails.uid &&
                ref.refUID === community.uid));
            return community;
        });
    }
    async communityBySlug(slug) {
        const communitySchema = GapSchema_1.GapSchema.find('CommunityDetails');
        const query = gql_queries_1.gqlQueries.attestationsOf(communitySchema.uid, this.getSearchFieldString('slug', slug));
        try {
            const { schema: { attestations }, } = await this.query(query);
            if (!attestations.length)
                throw new Error('Community not found.');
            const communities = (0, utils_1.mapFilter)(Attestation_1.Attestation.fromInterface(attestations), (details) => !!details.name, (details) => {
                const community = new Community_1.Community({
                    data: { community: true },
                    uid: details.refUID,
                    schema: communitySchema,
                    recipient: details.recipient,
                });
                community.details = details;
                return community;
            });
            const [withDetails] = await this.communitiesDetails(communities);
            if (!withDetails)
                throw new Error('Community not found.');
            const grants = await this.grantsByCommunity(withDetails.uid);
            withDetails.grants = grants;
            return withDetails;
        }
        catch (error) {
            throw error;
        }
    }
    async communityById(uid) {
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        if (!attestation)
            throw new Error('Community not found.');
        const communities = Attestation_1.Attestation.fromInterface([attestation]).map((c) => new Community_1.Community(c));
        const [withDetails] = await this.communitiesDetails(communities);
        if (!withDetails)
            throw new Error('Community not found.');
        const grants = await this.grantsByCommunity(uid);
        withDetails.grants = grants;
        return withDetails;
    }
    /**
     * Fetch the details for a set of
     * projects with project grants,
     * members, milestones, and tags.
     * @param projects
     */
    async projectsDetails(projects) {
        // Get projects array and fetch details, members, grants, etc then append to the project and return the array.
        const [projectDetails] = GapSchema_1.GapSchema.findMany(['ProjectDetails']);
        const refQuery = gql_queries_1.gqlQueries.dependentsOf(projects.map((p) => p.uid), [projectDetails.uid]);
        const [result, members, grants] = await Promise.all([
            this.query(refQuery),
            this.membersOf(projects),
            this.grantsFor(projects, true),
        ]);
        const deps = Attestation_1.Attestation.fromInterface(result.attestations || []);
        return projects.map((project) => {
            project.details = (deps.find((ref) => ref.schema.uid === projectDetails.uid && ref.refUID === project.uid));
            project.members = members.filter((m) => m.refUID === project.uid);
            project.grants = grants.filter((g) => g.refUID === project.uid);
            return project;
        });
    }
    async projectById(uid) {
        const query = gql_queries_1.gqlQueries.attestation(uid);
        const { attestation } = await this.query(query);
        if (!attestation)
            throw new Error('Project not found.');
        const projectAttestation = Attestation_1.Attestation.fromInterface([
            attestation,
        ])[0];
        const [result] = await this.projectsDetails([
            new entities_1.Project(projectAttestation),
        ]);
        return result;
    }
    async projectBySlug(slug) {
        const projectDetails = GapSchema_1.GapSchema.find('ProjectDetails');
        const query = gql_queries_1.gqlQueries.attestationsOf(projectDetails.uid, this.getSearchFieldString('slug', slug));
        const { schema: { attestations }, } = await this.query(query);
        const projectAttestations = Attestation_1.Attestation.fromInterface(attestations).filter((p) => p.title);
        if (!projectAttestations.length)
            throw new Error('Project not found.');
        const project = new entities_1.Project({
            data: { project: true },
            uid: projectAttestations[0].refUID,
            schema: GapSchema_1.GapSchema.find('Project'),
            recipient: projectAttestations[0].recipient,
        });
        const [withDetails] = await this.projectsDetails([project]);
        if (!withDetails)
            throw new Error('Project not found.');
        return withDetails;
    }
    async slugExists(slug) {
        const details = GapSchema_1.GapSchema.find('ProjectDetails');
        const query = gql_queries_1.gqlQueries.attestationsOf(details.uid, 'slug');
        const { schema: { attestations }, } = await this.query(query);
        return attestations.some((a) => a.decodedDataJson.includes(slug));
    }
    async projects(name) {
        const result = await this.attestations('Project', name);
        if (!result.length)
            return [];
        const projects = Attestation_1.Attestation.fromInterface(result);
        return this.projectsDetails(projects);
    }
    async projectsOf(grantee) {
        const result = await this.attestationsTo('Project', grantee);
        if (!result.length)
            return [];
        const projects = Attestation_1.Attestation.fromInterface(result);
        return this.projectsDetails(projects);
    }
    async grantee(address) {
        const projects = await this.projectsOf(address);
        return new attestations_1.Grantee(address, projects);
    }
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
    async grantsOf(grantee, withCommunity) {
        const [grant, grantDetails, grantVerified] = GapSchema_1.GapSchema.findMany([
            'Grant',
            'GrantDetails',
            'GrantVerified',
        ]);
        const query = gql_queries_1.gqlQueries.attestationsTo(grant.uid, grantee);
        const { schema: { attestations }, } = await this.query(query);
        const grants = Attestation_1.Attestation.fromInterface(attestations);
        if (!grants.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [grantDetails.uid, grantVerified.uid], grants.map((g) => g.recipient));
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        const milestones = await this.milestonesOf(grants);
        const communities = withCommunity
            ? await this.communitiesByIds((0, utils_1.mapFilter)(grants, (g) => !!g.communityUID, (g) => g.communityUID))
            : [];
        const withDetails = grants.map((grant) => {
            const refs = deps.filter((ref) => ref.refUID === grant.uid);
            grant.verified = !!refs.find((ref) => ref.schema.uid === grantVerified.uid && ref.refUID === grant.uid);
            grant.details = (refs.find((ref) => ref.schema.uid === grantDetails.uid &&
                ref.refUID === grant.uid &&
                typeof ref.endsAt === 'undefined'));
            grant.milestones = milestones.filter((m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined');
            grant.community = communities.find((c) => c.uid === grant.communityUID);
            return grant;
        });
        return this.grantsUpdates(withDetails);
    }
    async grantsUpdates(grants) {
        const details = GapSchema_1.GapSchema.find('GrantDetails');
        const query = gql_queries_1.gqlQueries.attestationsOf(details.uid, this.getSearchFieldString('type', 'grant-update'), grants.map((g) => g.uid));
        const { schema: { attestations }, } = await this.query(query);
        const updates = Attestation_1.Attestation.fromInterface(attestations);
        return grants.map((grant) => {
            grant.updates = updates.filter((u) => u.refUID === grant.uid);
            return grant;
        });
    }
    async grantsByCommunity(uid) {
        const [grant, grantDetails, project, projectDetails] = GapSchema_1.GapSchema.findMany([
            'Grant',
            'GrantDetails',
            'Project',
            'ProjectDetails',
        ]);
        const query = gql_queries_1.gqlQueries.attestations(grant.uid, uid);
        const { schema: { attestations }, } = await this.query(query);
        const grants = Attestation_1.Attestation.fromInterface(attestations).map((g) => new entities_1.Grant(g));
        if (!grants.length)
            return [];
        const refs = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => [g.uid, g.refUID]).flat(), [grantDetails.uid, project.uid]);
        const results = await this.query(refs);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        const projectsQuery = gql_queries_1.gqlQueries.attestationsIn(grants.map((g) => g.refUID));
        const { attestations: projectAttestations } = await this.query(projectsQuery);
        const projects = Attestation_1.Attestation.fromInterface(projectAttestations);
        const milestones = await this.milestonesOf(grants);
        return grants
            .map((grant) => {
            grant.project = projects.find((p) => p.uid === grant.refUID);
            grant.details = (deps.find((d) => d.refUID === grant.uid &&
                d.schema.uid === grantDetails.uid &&
                typeof d.amount !== undefined &&
                typeof d.endsAt === 'undefined' &&
                typeof d.data.type === 'undefined'));
            grant.milestones = milestones
                .filter((m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined')
                .sort((a, b) => a.endsAt - b.endsAt);
            grant.updates = deps.filter((d) => d.data.type && d.refUID === grant.uid);
            return grant;
        })
            .filter((g) => !!g.project);
    }
    async grantsFor(projects, withCommunity) {
        const [grant, grantDetails] = GapSchema_1.GapSchema.findMany([
            'Grant',
            'GrantDetails',
            'Milestone',
            'MilestoneApproved',
            'MilestoneCompleted',
        ]);
        const query = gql_queries_1.gqlQueries.dependentsOf(projects.map((p) => p.uid), [grant.uid]);
        const { attestations: grants } = await this.query(query);
        const grantsWithDetails = Attestation_1.Attestation.fromInterface(grants).map((g) => new entities_1.Grant(g));
        const ref = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [grantDetails.uid]);
        const { attestations } = await this.query(ref);
        const milestones = await this.milestonesOf(grantsWithDetails);
        const deps = Attestation_1.Attestation.fromInterface(attestations);
        // TODO unify this with grantsOf
        grantsWithDetails.forEach((grant) => {
            grant.details = (deps.find((d) => d.refUID === grant.uid &&
                d.schema.uid === grantDetails.uid &&
                typeof d.amount !== undefined &&
                typeof d.endsAt === 'undefined' &&
                typeof d.data.type === 'undefined'));
            grant.milestones = milestones
                .filter((m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined')
                .sort((a, b) => a.endsAt - b.endsAt);
        });
        const communities = withCommunity
            ? await this.communitiesByIds((0, utils_1.mapFilter)(grantsWithDetails, (g) => !!g.communityUID, (g) => g.communityUID))
            : [];
        grantsWithDetails.forEach((grant) => {
            grant.community = communities.find((c) => c.uid === grant.communityUID);
        });
        const grantsWithUpdates = await this.grantsUpdates(grantsWithDetails);
        return grantsWithUpdates.sort((a, b) => a.milestones?.at(-1)?.endsAt - b.milestones?.at(-1)?.endsAt ||
            a.createdAt.getTime() - b.createdAt.getTime());
    }
    async milestonesOf(grants) {
        const [milestone, milestoneApproved, milestoneCompleted] = GapSchema_1.GapSchema.findMany([
            'Milestone',
            'MilestoneApproved',
            'MilestoneCompleted',
        ]);
        const query = gql_queries_1.gqlQueries.dependentsOf(grants.map((g) => g.uid), [milestone.uid]);
        const { attestations } = await this.query(query);
        const milestones = Attestation_1.Attestation.fromInterface(attestations)
            .map((milestone) => new entities_1.Milestone(milestone))
            .filter((m) => typeof m.endsAt !== 'undefined');
        if (!milestones.length)
            return [];
        const ref = gql_queries_1.gqlQueries.dependentsOf(milestones.map((m) => m.uid), [milestoneApproved.uid, milestoneCompleted.uid]);
        const results = await this.query(ref);
        const deps = Attestation_1.Attestation.fromInterface(results.attestations || []);
        return milestones.map((milestone) => {
            const refs = deps.filter((ref) => ref.refUID === milestone.uid);
            milestone.endsAt = (0, to_unix_1.toUnix)(milestone.endsAt);
            milestone.completed = refs.find((dep) => dep.type === 'completed' && dep.refUID === milestone.uid);
            milestone.approved = refs.find((dep) => dep.type === 'approved' && dep.refUID === milestone.uid);
            milestone.rejected = refs.find((dep) => dep.type === 'rejected' && dep.refUID === milestone.uid);
            return milestone;
        });
    }
    async membersOf(projects) {
        const [member, memberDetails] = GapSchema_1.GapSchema.findMany([
            'MemberOf',
            'MemberDetails',
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
    /**
     * Returns a string to be used to search by a value in `decodedDataJson`.
     * @param field
     * @param value
     */
    getSearchFieldString(field, value) {
        return [
            String.raw `\\\\\"${field}\\\\\":\\\\\"${value}\\\\\"`,
            String.raw `\\\\\"${field}\\\\\": \\\\\"${value}\\\\\"`,
        ];
    }
}
exports.GapEasClient = GapEasClient;
