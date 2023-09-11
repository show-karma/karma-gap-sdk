import {
  EASNetworkConfig,
  SchemaInterface,
  TNetwork,
  TSchemaName,
} from "./types";

export const useDefaultAttestation: TSchemaName[] = [
  "MilestoneApproved",
  "MilestoneCompleted",
  "GrantVerified",
];

export const nullRef =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const nullResolver = "0x0000000000000000000000000000000000000000";
// resolver for dependents = 0xed081ABE885bc3575f810c904052A1f685A85903
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
  //     multicall:''
  //   },
  //   schemas: {
  //     Grant: "",
  //     GrantRound: "",
  //     GrantVerified: "",
  //     ExternalLink: "",
  //     MemberOf: "",
  //     MilestoneApproved: "",
  //     MilestoneCompleted: "",
  //     Project: "",
  //     Tag: "",
  //   },
  // },
  // "base-goerli": {
  //   chainId: 5,
  //   url: "https://base-goerli.easscan.org/graphql",
  //   contracts: {
  //     eas: "0xAcfE09Fd03f7812F022FBf636700AdEA18Fd2A7A",
  //     schema: "0x720c2bA66D19A725143FBf5fDC5b4ADA2742682E",
  //     multicall:''
  //   },
  //   schemas: {
  //     Grant: "",
  //     GrantRound: "",
  //     GrantVerified: "",
  //     ExternalLink: "",
  //     MemberOf: "",
  //     MilestoneApproved: "",
  //     MilestoneCompleted: "",
  //     Project: "",
  //     Tag: "",
  //   },
  // },
  // optimism: {
  //   chainId: 10,
  //   url: "https://optimism.easscan.org/graphql",
  //   contracts: {
  //     eas: "0x4200000000000000000000000000000000000021",
  //     schema: "0x4200000000000000000000000000000000000020",
  //     multicall:''
  //   },
  //   schemas: {
  //     Grant: "",
  //     GrantRound: "",
  //     GrantVerified: "",
  //     ExternalLink: "",
  //     MemberOf: "",
  //     MilestoneApproved: "",
  //     MilestoneCompleted: "",
  //     Project: "",
  //     Tag: "",
  //   },
  // },
  // "optimism-goerli": {
  //   chainId: 420,
  //   url: "https://optimism-goerli-bedrock.easscan.org/graphql",
  //   contracts: {
  //     eas: "0x4200000000000000000000000000000000000021",
  //     schema: "0x4200000000000000000000000000000000000020",
  //     multicall:''
  //   },
  //   schemas: {
  //     Grant: "",
  //     GrantRound: "",
  //     GrantVerified: "",
  //     ExternalLink: "",
  //     MemberOf: "",
  //     MilestoneApproved: "",
  //     MilestoneCompleted: "",
  //     Project: "",
  //     Tag: "",
  //   },
  // },
  // arbitrum: {
  //   chainId: 42161,
  //   url: "https://arbitrum.easscan.org/graphql",
  //   contracts: {
  //     eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
  //     schema: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB",
  //     multicall:''
  //   },
  //   schemas: {
  //     Grant: "",
  //     GrantRound: "",
  //     GrantVerified: "",
  //     ExternalLink: "",
  //     MemberOf: "",
  //     MilestoneApproved: "",
  //     MilestoneCompleted: "",
  //     Project: "",
  //     Tag: "",
  //   },
  // },
  sepolia: {
    chainId: 11155111,
    url: "https://sepolia.easscan.org/graphql",
    contracts: {
      eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
      schema: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
      multicall: "0x961c388408a3f36bE0deE18860D3B263e18B7502", // enhanced
      // multicall: "0x04D6BB799f5A8c76882C4372d1FC39Cd0DDA0A4c",// original
    },
    schemas: {
      Community:
        "0x43c83c4d3a7f335f23e35c7fc43a77f3907ad0bb2cc7a684619e1cd0f17d37b9", // test
      // "0x1954572e3fe21bf4334afdaf1358ed7098af1ed136e76dc93c2fdc25e83934c1", // original
      Details:
        "0xef3f9178d875914f5ccdfe3a39c26a5f9fdf98e5cdd72d4c9ab94d29a9ff2be2", // with resolver
      // "0xcf050d87a2a5a9ad69eab38ebdcc10aa3aee9d57ceeb9783f148f91a6532b7a0", // without resolver
      Grant:
        "0x22cd9fbc082e65ac85c8e4a5682e6ffbe8dc1a4f3a0a1cb4c2fc94878b058f0d", // with communityUID
      // "0xfccfe22b5c861b35f2aa0c6bffacf9f13dfed27724aa66984b8adb39fbfef98c", // with no data
      GrantRound:
        "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
      GrantVerified:
        "0x0be8952e2dd74ffd63a02f4d55b20b603fe7a60130cb9d70de31feb9c52fdd37",
      ExternalLink:
        "0xd354de1d01ebc5df5230bc483620c80ba2af96e65e2263f6f283410697004efd",
      MemberOf:
        "0xaaa3eb892d49ca6be51e3d1dd4a75825cba020bec837db0bba0b1d76dc3dda2c",
      MilestoneApproved:
        "0x650449549083b276a0c5f9ead240a75fce11c1d4f3d7accee3bb9a122e92a53f",
      MilestoneCompleted:
        "0x650449549083b276a0c5f9ead240a75fce11c1d4f3d7accee3bb9a122e92a53f",
      Project:
        "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
      Tag: "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58",
    },
  },
} as const;

const DetailsSchema = {
  name: "Details",
  schema: [{ type: "string", name: "json", value: null }],
};

/**
 * Mounts the schemas for the given network and return all the settings
 * @param network
 * @returns
 */
export const MountEntities = (
  network: EASNetworkConfig
): Record<TSchemaName, SchemaInterface<TSchemaName>> => ({
  Community: {
    name: "Community",
    schema: [{ type: "bool", name: "community", value: true }],
    uid: network.schemas.Community,
  },
  CommunityDetails: {
    ...DetailsSchema,
    uid: network.schemas.Details,
    references: "Community",
  },
  Project: {
    name: "Project",
    schema: [{ type: "bool", name: "project", value: true }],
    uid: network.schemas.Project,
  },
  ProjectDetails: {
    ...DetailsSchema,
    uid: network.schemas.Details,
    references: "Project",
  },
  MemberOf: {
    name: "MemberOf",
    schema: [{ type: "bool", name: "memberOf", value: true }],
    uid: network.schemas.MemberOf,
    references: "Project",
  },
  MemberDetails: {
    ...DetailsSchema,
    uid: network.schemas.Details,
    references: "MemberOf",
  },
  Grant: {
    name: "Grant",
    schema: [{ type: "bytes32", name: "communityUID", value: true }],
    // schema: [{ type: "bool", name: "grant", value: true }],
    uid: network.schemas.Grant,
    references: "Project",
  },
  GrantDetails: {
    ...DetailsSchema,
    uid: network.schemas.Details,
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
    ...DetailsSchema,
    uid: network.schemas.Details,
    references: "Grant",
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
  Details: {
    ...DetailsSchema,
    uid: network.schemas.Details,
  },
});
