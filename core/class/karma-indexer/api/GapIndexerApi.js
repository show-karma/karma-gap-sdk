"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapIndexerApi = void 0;
const AxiosGQL_1 = require("../../GraphQL/AxiosGQL");
const Endpoints = {
    attestations: {
        all: () => "/attestations",
        byUid: (uid) => `/attestations/${uid}`,
    },
    communities: {
        all: () => "/communities",
        admins: (uid) => `/communities/${uid}/admins`,
        byUidOrSlug: (uidOrSlug) => `/communities/${uidOrSlug}`,
        grants: (uidOrSlug) => `/communities/${uidOrSlug}/grants`,
    },
    grantees: {
        all: () => "/grantees",
        byAddress: (address) => `/grantees/${address}`,
        grants: (address) => `/grantees/${address}/grants`,
        projects: (address) => `/grantees/${address}/projects`,
        communities: (address, withGrants) => `/grantees/${address}/communities${withGrants ? "?withGrants=true" : ""}`,
        adminOf: (address) => `/grantees/${address}/communities/admin`,
    },
    grants: {
        all: () => "/grants",
        byUid: (uid) => `/grants/${uid}`,
        byExternalId: (id) => `/grants/external-id/${id}`,
    },
    project: {
        all: () => "/projects",
        byUidOrSlug: (uidOrSlug) => `/projects/${uidOrSlug}`,
        grants: (uidOrSlug) => `/projects/${uidOrSlug}/grants`,
        milestones: (uidOrSlug) => `/projects/${uidOrSlug}/milestones`,
    },
    search: {
        all: () => "/search",
    },
};
class GapIndexerApi extends AxiosGQL_1.AxiosGQL {
    constructor(url) {
        super(url);
    }
    async attestation(uid) {
        const response = await this.client.get(Endpoints.attestations.byUid(uid));
        return response;
    }
    async attestations(schemaUID, search) {
        const response = await this.client.get(Endpoints.attestations.all(), {
            params: {
                "filter[schemaUID]": schemaUID,
                "filter[data]": search,
            },
        });
        return response;
    }
    async attestationsOf(schemaUID, attester) {
        const response = await this.client.get(Endpoints.attestations.all(), {
            params: {
                "filter[schemaUID]": schemaUID,
                "filter[recipient]": attester,
            },
        });
        return response;
    }
    /**
     * Community
     */
    async communities(search) {
        const response = await this.client.get(Endpoints.communities.all(), {
            params: {
                "filter[name]": search,
            },
        });
        return response;
    }
    async communitiesOf(address, withGrants) {
        const response = await this.client.get(Endpoints.grantees.communities(address, withGrants));
        return response;
    }
    async adminOf(address) {
        const response = await this.client.get(Endpoints.grantees.adminOf(address));
        return response;
    }
    async communityBySlug(slug) {
        const response = await this.client.get(Endpoints.communities.byUidOrSlug(slug));
        return response;
    }
    async communityAdmins(uid) {
        const response = await this.client.get(Endpoints.communities.admins(uid));
        return response;
    }
    /**
     * Project
     */
    async projectBySlug(slug) {
        const response = await this.client.get(Endpoints.project.byUidOrSlug(slug));
        return response;
    }
    async search(query) {
        const response = await this.client.get(Endpoints.search.all(), {
            params: {
                q: query,
            },
        });
        return response;
    }
    async searchProjects(query) {
        const response = await this.client.get(Endpoints.project.all(), {
            params: {
                q: query,
            },
        });
        return response;
    }
    async projects(name) {
        const response = await this.client.get(Endpoints.project.all(), {
            params: {
                "filter[title]": name,
            },
        });
        return response;
    }
    async projectsOf(grantee) {
        const response = await this.client.get(Endpoints.grantees.projects(grantee));
        return response;
    }
    /**
     * Grantee
     */
    async grantee(address) {
        // TODO: update response type when the endpoint works
        const response = await this.client.get(Endpoints.grantees.byAddress(address));
        return response;
    }
    async grantees() {
        const response = await this.client.get(Endpoints.grantees.all());
        return response;
    }
    /**
     * Grant
     */
    async grantsOf(grantee, withCommunity) {
        const response = await this.client.get(Endpoints.grantees.grants(grantee));
        return response;
    }
    async grantsFor(uid, withCommunity) {
        const response = await this.client.get(Endpoints.project.grants(uid));
        return response;
    }
    async grantsForExtProject(projectExtId) {
        const response = await this.client.get(Endpoints.grants.byExternalId(projectExtId));
        return response;
    }
    async grantsByCommunity(uid) {
        const response = await this.client.get(Endpoints.communities.grants(uid));
        return response;
    }
    /**
     * Milestone
     */
    async milestonesOf(uid) {
        const response = await this.client.get(Endpoints.project.milestones(uid));
        return response;
    }
    async slugExists(slug) {
        try {
            await this.client.get(Endpoints.project.byUidOrSlug(slug));
            return true;
        }
        catch (err) {
            return false;
        }
    }
}
exports.GapIndexerApi = GapIndexerApi;
