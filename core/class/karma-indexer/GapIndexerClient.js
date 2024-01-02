"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapIndexerClient = void 0;
const Attestation_1 = require("../Attestation");
const Fetcher_1 = require("../Fetcher");
const entities_1 = require("../entities");
const format_path_1 = require("../../utils/format-path");
const Endpoints = {
    attestations: {
        all: () => '/attestations',
        byUid: (uid) => `/attestations/${uid}`,
    },
    communities: {
        all: (page, pageLimit) => (0, format_path_1.formatPath)(`/communities`, { page, pageLimit }),
        byUidOrSlug: (uidOrSlug) => `/communities/${uidOrSlug}`,
        grants: (uidOrSlug, page, pageLimit) => (0, format_path_1.formatPath)(`/communities/${uidOrSlug}/grants`, { page, pageLimit })
    },
    grantees: {
        all: () => '/grantees',
        byAddress: (address) => `/grantees/${address}`,
        grants: (address) => `/grantees/${address}/grants`,
        projects: (address) => `/grantees/${address}/projects`,
        communities: (address, withGrants) => `/grantees/${address}/communities${withGrants ? '?withGrants=true' : ''}`,
    },
    grants: {
        all: () => '/grants',
        byUid: (uid) => `/grants/${uid}`,
        byExternalId: (id) => `/grants/external-id/${id}`,
    },
    project: {
        all: (page, pageLimit) => (0, format_path_1.formatPath)(`/projects`, { page, pageLimit }),
        byUidOrSlug: (uidOrSlug) => `/projects/${uidOrSlug}`,
        grants: (uidOrSlug) => `/projects/${uidOrSlug}/grants`,
        milestones: (uidOrSlug) => `/projects/${uidOrSlug}/milestones`,
    },
};
class GapIndexerClient extends Fetcher_1.Fetcher {
    async attestation(uid) {
        const { data } = await this.client.get(Endpoints.attestations.byUid(uid));
        if (!data)
            throw new Error('Attestation not found');
        return Attestation_1.Attestation.fromInterface([data], this.gap.network)[0];
    }
    async attestations(schemaName, search) {
        const { data } = await this.client.get(Endpoints.attestations.all(), {
            params: {
                'filter[schemaUID]': this.gap.findSchema(schemaName).uid,
                'filter[data]': search,
            },
        });
        return data || [];
    }
    async attestationsOf(schemaName, attester) {
        const { data } = await this.client.get(Endpoints.attestations.all(), {
            params: {
                'filter[schemaUID]': this.gap.findSchema(schemaName).uid,
                'filter[recipient]': attester,
            },
        });
        return data || [];
    }
    attestationsTo(schemaName, recipient) {
        return this.attestationsOf(schemaName, recipient);
    }
    async communities(search) {
        const { data } = await this.client.get(Endpoints.communities.all(), {
            params: {
                'filter[name]': search,
            },
        });
        return entities_1.Community.from(data, this.gap.network);
    }
    async communitiesOf(address, withGrants) {
        const { data } = await this.client.get(Endpoints.grantees.communities(address, withGrants));
        return entities_1.Community.from(data, this.gap.network);
    }
    communitiesByIds(uids) {
        throw new Error('Method not implemented.');
    }
    async communityBySlug(slug) {
        const { data } = await this.client.get(Endpoints.communities.byUidOrSlug(slug));
        return entities_1.Community.from([data], this.gap.network)[0];
    }
    communityById(uid) {
        return this.communityBySlug(uid);
    }
    async projectBySlug(slug) {
        const { data } = await this.client.get(Endpoints.project.byUidOrSlug(slug));
        return entities_1.Project.from([data], this.gap.network)[0];
    }
    projectById(uid) {
        return this.projectBySlug(uid);
    }
    async searchProjects(query) {
        const { data } = await this.client.get(Endpoints.project.all(), {
            params: {
                q: query,
            },
        });
        return entities_1.Project.from(data, this.gap.network);
    }
    async projects(name) {
        const { data } = await this.client.get(Endpoints.project.all(), {
            params: {
                'filter[title]': name,
            },
        });
        return entities_1.Project.from(data, this.gap.network);
    }
    async projectsOf(grantee) {
        const { data } = await this.client.get(Endpoints.grantees.projects(grantee));
        return entities_1.Project.from(data, this.gap.network);
    }
    async grantee(address) {
        const { data } = await this.client.get(Endpoints.grantees.byAddress(address));
        return data;
    }
    async grantees() {
        const { data } = await this.client.get(Endpoints.grantees.all());
        return data;
    }
    async grantsOf(grantee, withCommunity) {
        const { data } = await this.client.get(Endpoints.grantees.grants(grantee));
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsFor(projects, withCommunity) {
        const { data } = await this.client.get(Endpoints.project.grants(projects[0].uid));
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsForExtProject(projectExtId) {
        const { data } = await this.client.get(Endpoints.grants.byExternalId(projectExtId));
        return entities_1.Grant.from(data, this.gap.network);
    }
    async grantsByCommunity(uid, page, pageLimit) {
        console.log({ uid, page, pageLimit });
        const { data } = await this.client.get(Endpoints.communities.grants(uid, page, pageLimit));
        return entities_1.Grant.from(data, this.gap.network);
    }
    async milestonesOf(grants) {
        const { data } = await this.client.get(Endpoints.project.milestones(grants[0].uid));
        return entities_1.Milestone.from(data, this.gap.network);
    }
    async membersOf(projects) {
        throw new Error('Method not implemented.');
    }
    async slugExists(slug) {
        try {
            await this.client.get(Endpoints.project.byUidOrSlug(slug));
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.GapIndexerClient = GapIndexerClient;
