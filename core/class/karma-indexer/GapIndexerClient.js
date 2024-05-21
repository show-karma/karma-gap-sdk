"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapIndexerClient = void 0;
const Attestation_1 = require("../Attestation");
const Fetcher_1 = require("../Fetcher");
const entities_1 = require("../entities");
const GapIndexerApi_1 = require("./api/GapIndexerApi");
const Endpoints = {
    attestations: {
        all: () => '/attestations',
        byUid: (uid) => `/attestations/${uid}`,
    },
    communities: {
        all: () => '/communities',
        byUidOrSlug: (uidOrSlug) => `/communities/${uidOrSlug}`,
        grants: (uidOrSlug) => `/communities/${uidOrSlug}/grants`,
    },
    grantees: {
        all: () => '/grantees',
        byAddress: (address) => `/grantees/${address}`,
        grants: (address) => `/grantees/${address}/grants`,
        projects: (address) => `/grantees/${address}/projects`,
        communities: (address, withGrants) => `/grantees/${address}/communities${withGrants ? '?withGrants=true' : ''}`,
        communitiesAdmin: (address, withGrants) => `/grantees/${address}/communities/admin${withGrants ? '?withGrants=true' : ''}`,
    },
    grants: {
        all: () => '/grants',
        byUid: (uid) => `/grants/${uid}`,
        byExternalId: (id) => `/grants/external-id/${id}`,
    },
    project: {
        all: () => '/projects',
        byUidOrSlug: (uidOrSlug) => `/projects/${uidOrSlug}`,
        grants: (uidOrSlug) => `/projects/${uidOrSlug}/grants`,
        milestones: (uidOrSlug) => `/projects/${uidOrSlug}/milestones`,
    },
};
class GapIndexerClient extends Fetcher_1.Fetcher {
    constructor(params) {
        super(params);
        this.apiClient = new GapIndexerApi_1.GapIndexerApi(params);
    }
    async attestation(uid) {
        const { data } = await this.apiClient.attestation(uid);
        if (!data)
            throw new Error('Attestation not found');
        return Attestation_1.Attestation.fromInterface([data], this.gap.network)[0];
    }
    async attestations(schemaName, search) {
        const schemaUID = this.gap.findSchema(schemaName).uid;
        const { data } = await this.apiClient.attestations(schemaUID, search);
        return data || [];
    }
    async attestationsOf(schemaName, attester) {
        const schemaUID = this.gap.findSchema(schemaName).uid;
        const { data } = await this.apiClient.attestationsOf(schemaUID, attester);
        return data || [];
    }
    attestationsTo(schemaName, recipient) {
        return this.attestationsOf(schemaName, recipient);
    }
    async communities(search) {
        const { data } = await this.apiClient.communities(search);
        return entities_1.Community.from(data, this.gap.network);
    }
    async communitiesOf(address, withGrants) {
        const { data } = await this.apiClient.communitiesOf(address, withGrants);
        return entities_1.Community.from(data, this.gap.network);
    }
    async adminOf(address) {
        const { data } = await this.apiClient.adminOf(address);
        return entities_1.Community.from(data, this.gap.network);
    }
    async communitiesAdminOf(address, withGrants) {
        const { data } = await this.client.get(Endpoints.grantees.communitiesAdmin(address, withGrants));
        return entities_1.Community.from(data, this.gap.network);
    }
    communitiesByIds(uids) {
        throw new Error('Method not implemented.');
    }
    async communityBySlug(slug) {
        const { data } = await this.apiClient.communityBySlug(slug);
        return entities_1.Community.from([data], this.gap.network)[0];
    }
    communityById(uid) {
        return this.communityBySlug(uid);
    }
    async communityAdmins(uid) {
        const { data } = await this.apiClient.communityAdmins(uid);
        return data;
    }
    async projectBySlug(slug) {
        const { data } = await this.apiClient.projectBySlug(slug);
        return entities_1.Project.from([data], this.gap.network)[0];
    }
    projectById(uid) {
        return this.projectBySlug(uid);
    }
    async search(query) {
        const { data } = await this.apiClient.search(query);
        return { data };
    }
    async searchProjects(query) {
        const { data } = await this.apiClient.searchProjects(query);
        return entities_1.Project.from(data, this.gap.network);
    }
    async projects(name) {
        const { data } = await this.apiClient.projects(name);
        return entities_1.Project.from(data, this.gap.network);
    }
    async projectsOf(grantee) {
        const { data } = await this.apiClient.projectsOf(grantee);
        return entities_1.Project.from(data, this.gap.network);
    }
    async grantee(address) {
        const { data } = await this.apiClient.grantee(address);
        return data;
    }
    async grantees() {
        const { data } = await this.apiClient.grantees();
        return data; // TODO: Remove this casting after the api is fixed
    }
    async grantsOf(grantee, withCommunity) {
        const { data } = await this.apiClient.grantsOf(grantee, withCommunity);
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsFor(projects, withCommunity) {
        const { data } = await this.apiClient.grantsFor(projects[0].uid, withCommunity);
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsForExtProject(projectExtId) {
        const { data } = await this.apiClient.grantsForExtProject(projectExtId);
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsByCommunity(uid) {
        const { data } = await this.apiClient.grantsByCommunity(uid);
        return entities_1.Grant.from(data, this.gap.network);
    }
    async milestonesOf(grants) {
        const { data } = await this.apiClient.milestonesOf(grants[0].uid);
        return entities_1.Milestone.from(data, this.gap.network);
    }
    async membersOf(projects) {
        throw new Error('Method not implemented.');
    }
    async slugExists(slug) {
        return await this.apiClient.slugExists(slug);
    }
}
exports.GapIndexerClient = GapIndexerClient;
