"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapIndexerApi = void 0;
const AxiosGQL_1 = require("../../GraphQL/AxiosGQL");
const Endpoints = {
    attestations: {
        all: (prune = false) => `/attestations?prune=${prune}`,
        byUid: (uid, prune = false) => `/attestations/${uid}?prune=${prune}`,
    },
    communities: {
        all: (prune = false) => `/communities?prune=${prune}`,
        admins: (uid, prune = false) => `/communities/${uid}/admins?prune=${prune}`,
        byUidOrSlug: (uidOrSlug, prune = false) => `/communities/${uidOrSlug}?prune=${prune}`,
        grants: (uidOrSlug, page = 0, pageLimit = 100, prune = false) => `/communities/${uidOrSlug}/grants?prune=${prune}${page ? `&page=${page}` : ""}${pageLimit ? `&pageLimit=${pageLimit}` : ""}`,
    },
    grantees: {
        all: (prune = false) => `/grantees?prune=${prune}`,
        byAddress: (address, prune = false) => `/grantees/${address}?prune=${prune}`,
        grants: (address, prune = false) => `/grantees/${address}/grants?prune=${prune}`,
        projects: (address, prune = false) => `/grantees/${address}/projects?prune=${prune}`,
        communities: (address, withGrants, prune = false) => `/grantees/${address}/communities?prune=${prune}${withGrants ? "&withGrants=true" : ""}`,
        adminOf: (address, prune = false) => `/grantees/${address}/communities/admin?prune=${prune}`,
    },
    grants: {
        all: (prune = false) => `/grants?prune=${prune}`,
        byUid: (uid, prune = false) => `/grants/${uid}?prune=${prune}`,
        byExternalId: (id, prune = false) => `/grants/external-id/${id}?prune=${prune}`,
    },
    project: {
        all: (prune = false) => `/projects?prune=${prune}`,
        byUidOrSlug: (uidOrSlug, prune = false) => `/projects/${uidOrSlug}?prune=${prune}`,
        grants: (uidOrSlug, prune = false) => `/projects/${uidOrSlug}/grants?prune=${prune}`,
        milestones: (uidOrSlug, prune = false) => `/projects/${uidOrSlug}/milestones?prune=${prune}`,
        projectMilestones: (uidOrSlug, prune = false) => `/projects/${uidOrSlug}/project-milestones?prune=${prune}`,
    },
    search: {
        all: (prune = false) => `/search?prune=${prune}`,
    },
};
class GapIndexerApi extends AxiosGQL_1.AxiosGQL {
    constructor(url) {
        super(url);
    }
    async attestation(uid, prune = false) {
        const response = await this.client.get(Endpoints.attestations.byUid(uid, prune));
        return response;
    }
    async attestations(schemaUID, search, prune = false) {
        const response = await this.client.get(Endpoints.attestations.all(prune), {
            params: {
                "filter[schemaUID]": schemaUID,
                "filter[data]": search,
            },
        });
        return response;
    }
    async attestationsOf(schemaUID, attester, prune = false) {
        const response = await this.client.get(Endpoints.attestations.all(prune), {
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
    async communities(search, prune = false) {
        const response = await this.client.get(Endpoints.communities.all(prune), {
            params: {
                "filter[name]": search,
            },
        });
        return response;
    }
    async communitiesOf(address, withGrants, prune = false) {
        const response = await this.client.get(Endpoints.grantees.communities(address, withGrants, prune));
        return response;
    }
    async adminOf(address, prune = false) {
        const response = await this.client.get(Endpoints.grantees.adminOf(address, prune));
        return response;
    }
    async communityBySlug(slug, prune = false) {
        const response = await this.client.get(Endpoints.communities.byUidOrSlug(slug, prune));
        return response;
    }
    async communityAdmins(uid, prune = false) {
        const response = await this.client.get(Endpoints.communities.admins(uid, prune));
        return response;
    }
    /**
     * Project
     */
    async projectBySlug(slug, prune = false) {
        const response = await this.client.get(Endpoints.project.byUidOrSlug(slug, prune));
        return response;
    }
    async search(query, prune = false) {
        const response = await this.client.get(Endpoints.search.all(prune), {
            params: {
                q: query,
            },
        });
        return response;
    }
    async searchProjects(query, prune = false) {
        const response = await this.client.get(Endpoints.project.all(prune), {
            params: {
                q: query,
            },
        });
        return response;
    }
    async projects(name, prune = false) {
        const response = await this.client.get(Endpoints.project.all(prune), {
            params: {
                "filter[title]": name,
            },
        });
        return response;
    }
    async projectsOf(grantee, prune = false) {
        const response = await this.client.get(Endpoints.grantees.projects(grantee, prune));
        return response;
    }
    async projectMilestones(uidOrSlug, prune = false) {
        const response = await this.client.get(Endpoints.project.projectMilestones(uidOrSlug, prune));
        return response;
    }
    /**
     * Grantee
     */
    async grantee(address, prune = false) {
        // TODO: update response type when the endpoint works
        const response = await this.client.get(Endpoints.grantees.byAddress(address, prune));
        return response;
    }
    async grantees(prune = false) {
        const response = await this.client.get(Endpoints.grantees.all(prune));
        return response;
    }
    /**
     * Grant
     */
    async grantsOf(grantee, withCommunity, prune = false) {
        const response = await this.client.get(Endpoints.grantees.grants(grantee, prune));
        return response;
    }
    async grantsFor(uid, withCommunity, prune = false) {
        const response = await this.client.get(Endpoints.project.grants(uid, prune));
        return response;
    }
    async grantsForExtProject(projectExtId, prune = false) {
        const response = await this.client.get(Endpoints.grants.byExternalId(projectExtId, prune));
        return response;
    }
    async grantBySlug(slug, prune = false) {
        const response = await this.client.get(Endpoints.grants.byUid(slug, prune));
        return response;
    }
    async grantsByCommunity(uid, page = 0, pageLimit = 100, prune = false) {
        const response = await this.client.get(Endpoints.communities.grants(uid, page, pageLimit, prune));
        return response;
    }
    /**
     * Milestone
     */
    async milestonesOf(uid, prune = false) {
        const response = await this.client.get(Endpoints.project.milestones(uid, prune));
        return response;
    }
    async slugExists(slug, prune = false) {
        try {
            await this.client.get(Endpoints.project.byUidOrSlug(slug, prune));
            return true;
        }
        catch (err) {
            return false;
        }
    }
}
exports.GapIndexerApi = GapIndexerApi;
