import { SchemaInterface } from "./class/Schema";
import { EASNetworkConfig, TNetwork, TSchemaName } from "./types";

export const nullRef =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const nullResolver = "0x0000000000000000000000000000000000000000";

/**
 * The networks that are supported by the EAS
 */
export const Networks: Record<TNetwork, EASNetworkConfig> = {
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
    },
    schemas: {
      Grant:
        "0xfccfe22b5c861b35f2aa0c6bffacf9f13dfed27724aa66984b8adb39fbfef98c",
      GrantDetails:
        "0xd0d1118c21c6c7310c875fe8ed154760109246a10c2052e6fdb0066cb5fd1aa5",
      GrantRound:
        "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
      GrantVerified:
        "0x1e3b7d70d89f30ebe9f0ae987e34242b14e7fb07e25205458cf2813449fb4136",
      Grantee:
        "0x223856f6ed212325d5585fe903e952d76212047b52dc9d48b5e7d45682732a7a",
      GranteeDetails:
        "0xbfe0866beec569e809f79d1f19a87551c92a55940af431273da7680d02eb4010",
      ExternalLink:
        "0xd354de1d01ebc5df5230bc483620c80ba2af96e65e2263f6f283410697004efd",
      MemberDetails:
        "0x8a10b1f25006f6e4a675f268e64e1c729ee0713adbdce3984f5bdad6302aef19",
      MemberOf:
        "0xaaa3eb892d49ca6be51e3d1dd4a75825cba020bec837db0bba0b1d76dc3dda2c",
      Milestone:
        "0xfdea9469a2318d97848ab6b90ab8a1e496a1d05a02d6339d088723dbfd4669de",
      MilestoneApproved:
        "0x1e3b7d70d89f30ebe9f0ae987e34242b14e7fb07e25205458cf2813449fb4136",
      MilestoneCompleted:
        "0x1e3b7d70d89f30ebe9f0ae987e34242b14e7fb07e25205458cf2813449fb4136",
      Project:
        "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
      ProjectDetails:
        "0xdddf1698baf08a6edd49a949b7a482be55a15c912ba3ebd83d7cfa6fa191d2cf",
      Tag: "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
    },
  },
} as const;

/**
 * Mounts the schemas for the given network and return all the settings
 * @param network
 * @returns
 */
export const MountEntities = (
  network: EASNetworkConfig
): Record<TSchemaName, SchemaInterface<TSchemaName>> => ({
  Grantee: {
    name: "Grantee",
    schema: [{ type: "bool", name: "grantee", value: true }],
    uid: network.schemas.Grantee,
  },
  GranteeDetails: {
    name: "GranteeDetails",
    schema: [
      { type: "string", name: "name", value: null },
      { type: "string", name: "description", value: null },
      { type: "address", name: "ownerAddress", value: null },
      { type: "address", name: "payoutAddress", value: null },
    ],
    uid: network.schemas.GranteeDetails,
    references: "Grantee",
  },
  Project: {
    name: "Project",
    schema: [{ type: "bool", name: "project", value: true }],
    uid: network.schemas.Project,
    references: "Grantee",
  },
  ProjectDetails: {
    name: "ProjectDetails",
    schema: [
      { type: "string", name: "title", value: null },
      { type: "string", name: "description", value: null },
      { type: "string", name: "imageURL", value: null },
    ],
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
    schema: [
      { type: "string", name: "name", value: null },
      { type: "string", name: "profilePictureURL", value: null },
    ],
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
    schema: [
      { type: "string", name: "title", value: null },
      { type: "string", name: "description", value: null },
      { type: "string", name: "proposalURL", value: null },
      { type: "string[]", name: "assetAndChainId", value: null },
    ],
    uid: network.schemas.GrantDetails,
    references: "Grant",
  },
  GrantVerified: {
    name: "GrantVerified",
    schema: [{ type: "bool", name: "grantVerified", value: true }],
    uid: network.schemas.GrantVerified,
    references: "Grant",
  },
  GrantRound: {
    name: "GrantRound",
    schema: [{ type: "bool", name: "name", value: true }],
    uid: network.schemas.GrantRound,
    references: "Grant",
  },
  Milestone: {
    name: "Milestone",
    schema: [
      { type: "string", name: "title", value: null },
      { type: "uint48", name: "startsAt", value: null },
      { type: "uint48", name: "endsAt", value: null },
      { type: "string", name: "description", value: null },
    ],
    references: "Grant",
    uid: network.schemas.Milestone,
  },
  MilestoneApproved: {
    name: "MilestoneApproved",
    schema: [{ type: "bool", name: "milestoneApproved", value: false }],
    uid: network.schemas.MilestoneApproved,
    references: "Milestone",
  },
  MilestoneCompleted: {
    name: "MilestoneCompleted",
    schema: [{ type: "bool", name: "milestoneCompleted", value: false }],
    uid: network.schemas.MilestoneCompleted,
    references: "Milestone",
  },
  Tag: {
    name: "Tag",
    schema: [{ type: "string", name: "name", value: null }],
    uid: network.schemas.Tag,
    references: "ProjectDetails",
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
