"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapIndexerClient = void 0;
const Attestation_1 = require("../Attestation");
const GapSchema_1 = require("../GapSchema");
const Fetcher_1 = require("../Fetcher");
const entities_1 = require("../entities");
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
    async attestation(uid) {
        const { data } = await this.client.get(Endpoints.attestations.byUid(uid));
        if (!data)
            throw new Error('Attestation not found');
        return Attestation_1.Attestation.fromInterface([data])[0];
    }
    async attestations(schemaName, search) {
        const { data } = await this.client.get(Endpoints.attestations.all(), {
            params: {
                'filter[schemaUID]': GapSchema_1.GapSchema.get(schemaName).uid,
                'filter[data]': search,
            },
        });
        return data || [];
    }
    async attestationsOf(schemaName, attester) {
        const { data } = await this.client.get(Endpoints.attestations.all(), {
            params: {
                'filter[schemaUID]': GapSchema_1.GapSchema.get(schemaName).uid,
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
        return entities_1.Community.from(data);
    }
    async communitiesOf(address, withGrants) {
        const { data } = await this.client.get(Endpoints.grantees.communities(address, withGrants));
        return entities_1.Community.from(data);
    }
    communitiesByIds(uids) {
        throw new Error('Method not implemented.');
    }
    async communityBySlug(slug) {
        const { data } = await this.client.get(Endpoints.communities.byUidOrSlug(slug));
        return entities_1.Community.from([data])[0];
    }
    communityById(uid) {
        return this.communityBySlug(uid);
    }
    async projectBySlug(slug) {
        const { data } = await this.client.get(Endpoints.project.byUidOrSlug(slug));
        return entities_1.Project.from([data])[0];
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
        return entities_1.Project.from(data);
    }
    async projects(name) {
        const { data } = await this.client.get(Endpoints.project.all(), {
            params: {
                'filter[title]': name,
            },
        });
        return entities_1.Project.from(data);
    }
    async projectsOf(grantee) {
        const { data } = await this.client.get(Endpoints.grantees.projects(grantee));
        return entities_1.Project.from(data);
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
        return entities_1.Grant.from(data);
    }
    async grantsFor(projects, withCommunity) {
        const { data } = await this.client.get(Endpoints.project.grants(projects[0].uid));
        return entities_1.Grant.from(data);
    }
    async grantsForExtProject(projectExtId) {
        const { data } = await this.client.get(Endpoints.grants.byExternalId(projectExtId));
        return entities_1.Grant.from(data);
    }
    async grantsByCommunity(uid) {
        const { data } = await this.client.get(Endpoints.communities.grants(uid));
        return entities_1.Grant.from(data);
    }
    async milestonesOf(grants) {
        const { data } = await this.client.get(Endpoints.project.milestones(grants[0].uid));
        return entities_1.Milestone.from(data);
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
