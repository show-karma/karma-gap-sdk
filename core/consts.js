"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MountEntities = exports.Networks = exports.nullResolver = exports.nullRef = void 0;
exports.nullRef = "0x0000000000000000000000000000000000000000000000000000000000000000";
exports.nullResolver = "0x0000000000000000000000000000000000000000";
/**
 * The networks that are supported by the EAS
 */
exports.Networks = {
    // mainnet: {
    //   url: "https://easscan.org/graphql",
    //   chainId: 1,
    //   contracts: {
    //     eas: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
    //     schema: "0xA7b39296258348C78294F95B872b282326A97BDF",
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantDetails: "",
    //     GrantRound: "",
    //     GrantVerified: "",
    //     Grantee: "",
    //     GranteeDetails: "",
    //     ExternalLink: "",
    //     MemberDetails: "",
    //     MemberOf: "",
    //     Milestone: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //     ProjectDetails: "",
    //     Tag: "",
    //   },
    // },
    // "base-goerli": {
    //   chainId: 5,
    //   url: "https://base-goerli.easscan.org/graphql",
    //   contracts: {
    //     eas: "0xAcfE09Fd03f7812F022FBf636700AdEA18Fd2A7A",
    //     schema: "0x720c2bA66D19A725143FBf5fDC5b4ADA2742682E",
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantDetails: "",
    //     GrantRound: "",
    //     GrantVerified: "",
    //     Grantee: "",
    //     GranteeDetails: "",
    //     ExternalLink: "",
    //     MemberDetails: "",
    //     MemberOf: "",
    //     Milestone: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //     ProjectDetails: "",
    //     Tag: "",
    //   },
    // },
    // optimism: {
    //   chainId: 10,
    //   url: "https://optimism.easscan.org/graphql",
    //   contracts: {
    //     eas: "0x4200000000000000000000000000000000000021",
    //     schema: "0x4200000000000000000000000000000000000020",
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantDetails: "",
    //     GrantRound: "",
    //     GrantVerified: "",
    //     Grantee: "",
    //     GranteeDetails: "",
    //     ExternalLink: "",
    //     MemberDetails: "",
    //     MemberOf: "",
    //     Milestone: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //     ProjectDetails: "",
    //     Tag: "",
    //   },
    // },
    // "optimism-goerli": {
    //   chainId: 420,
    //   url: "https://optimism-goerli-bedrock.easscan.org/graphql",
    //   contracts: {
    //     eas: "0x4200000000000000000000000000000000000021",
    //     schema: "0x4200000000000000000000000000000000000020",
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantDetails: "",
    //     GrantRound: "",
    //     GrantVerified: "",
    //     Grantee: "",
    //     GranteeDetails: "",
    //     ExternalLink: "",
    //     MemberDetails: "",
    //     MemberOf: "",
    //     Milestone: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //     ProjectDetails: "",
    //     Tag: "",
    //   },
    // },
    // arbitrum: {
    //   chainId: 42161,
    //   url: "https://arbitrum.easscan.org/graphql",
    //   contracts: {
    //     eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
    //     schema: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB",
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantDetails: "",
    //     GrantRound: "",
    //     GrantVerified: "",
    //     Grantee: "",
    //     GranteeDetails: "",
    //     ExternalLink: "",
    //     MemberDetails: "",
    //     MemberOf: "",
    //     Milestone: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //     ProjectDetails: "",
    //     Tag: "",
    //   },
    // },
    sepolia: {
        chainId: 11155111,
        url: "https://sepolia.easscan.org/graphql",
        contracts: {
            eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
            schema: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
            multicall: "0x04D6BB799f5A8c76882C4372d1FC39Cd0DDA0A4c",
        },
        schemas: {
            Community: "0x1954572e3fe21bf4334afdaf1358ed7098af1ed136e76dc93c2fdc25e83934c1",
            CommunityDetails: "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0",
            Grant: "0xfccfe22b5c861b35f2aa0c6bffacf9f13dfed27724aa66984b8adb39fbfef98c",
            GrantDetails: "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0",
            GrantRound: "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
            GrantVerified: "0x0be8952e2dd74ffd63a02f4d55b20b603fe7a60130cb9d70de31feb9c52fdd37",
            ExternalLink: "0xd354de1d01ebc5df5230bc483620c80ba2af96e65e2263f6f283410697004efd",
            MemberDetails: "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0",
            MemberOf: "0xaaa3eb892d49ca6be51e3d1dd4a75825cba020bec837db0bba0b1d76dc3dda2c",
            Milestone: "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0",
            MilestoneApproved: "0x650449549083b276a0c5f9ead240a75fce11c1d4f3d7accee3bb9a122e92a53f",
            MilestoneCompleted: "0x650449549083b276a0c5f9ead240a75fce11c1d4f3d7accee3bb9a122e92a53f",
            Project: "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
            ProjectDetails: "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0",
            Tag: "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
        },
    },
};
/**
 * Mounts the schemas for the given network and return all the settings
 * @param network
 * @returns
 */
const MountEntities = (network) => ({
    Community: {
        name: "Community",
        schema: [{ type: "bool", name: "community", value: true }],
        uid: network.schemas.Community,
    },
    CommunityDetails: {
        name: "CommunityDetails",
        schema: [{ type: "string", name: "json", value: null }],
        uid: network.schemas.CommunityDetails,
        references: "Community",
    },
    Project: {
        name: "Project",
        schema: [{ type: "bool", name: "project", value: true }],
        uid: network.schemas.Project,
    },
    ProjectDetails: {
        name: "ProjectDetails",
        schema: [{ type: "string", name: "json", value: null }],
        uid: network.schemas.ProjectDetails,
        references: "Project",
    },
    MemberOf: {
        name: "MemberOf",
        schema: [{ type: "bool", name: "memberOf", value: true }],
        uid: network.schemas.MemberOf,
        references: "Project",
    },
    MemberDetails: {
        name: "MemberDetails",
        schema: [{ type: "string", name: "json", value: null }],
        uid: network.schemas.MemberDetails,
        references: "MemberOf",
    },
    Grant: {
        name: "Grant",
        schema: [{ type: "bool", name: "grant", value: true }],
        uid: network.schemas.Grant,
        references: "Project",
    },
    GrantDetails: {
        name: "GrantDetails",
        schema: [{ type: "string", name: "json", value: null }],
        uid: network.schemas.GrantDetails,
        references: "Grant",
    },
    GrantVerified: {
        name: "GrantVerified",
        schema: [{ type: "bool", name: "isVerified", value: true }],
        uid: network.schemas.GrantVerified,
        references: "Grant",
    },
    GrantRound: {
        name: "GrantRound",
        schema: [{ type: "string", name: "name", value: true }],
        uid: network.schemas.GrantRound,
        references: "Grant",
    },
    Milestone: {
        name: "Milestone",
        schema: [{ type: "string", name: "json", value: null }],
        references: "Grant",
        uid: network.schemas.Milestone,
    },
    MilestoneApproved: {
        name: "MilestoneApproved",
        schema: [
            { type: "string", name: "type", value: null },
            { type: "string", name: "reason", value: "" },
        ],
        uid: network.schemas.MilestoneApproved,
        references: "Milestone",
    },
    MilestoneCompleted: {
        name: "MilestoneCompleted",
        schema: [
            { type: "string", name: "type", value: null },
            { type: "string", name: "reason", value: "" },
        ],
        uid: network.schemas.MilestoneCompleted,
        references: "Milestone",
    },
    Tag: {
        name: "Tag",
        schema: [{ type: "string", name: "name", value: null }],
        uid: network.schemas.Tag,
        references: "Project",
    },
    ExternalLink: {
        name: "ExternalLink",
        schema: [
            { type: "string", name: "type", value: null },
            { type: "string", name: "url", value: null },
        ],
        uid: network.schemas.ExternalLink,
        references: "Project",
    },
});
exports.MountEntities = MountEntities;
