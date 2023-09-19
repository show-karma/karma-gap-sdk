import {
  EASNetworkConfig,
  SchemaInterface,
  TNetwork,
  TSchemaName,
} from "./types";

/**
 * Schemas that should use default EAS attestation
 * instead of the custom contract.
 */
export const useDefaultAttestation: TSchemaName[] = [
  "MilestoneApproved",
  "MilestoneCompleted",
  "GrantVerified",
  "Community",
  "CommunityDetails",
];

export const nullRef =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// TODO: Remove null resolver and change usage to zero address
export const nullResolver = "0x0000000000000000000000000000000000000000";

export const zeroAddress = nullResolver;
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
  "optimism-goerli": {
    chainId: 420,
    url: "https://optimism-goerli-bedrock.easscan.org/graphql",
    contracts: {
      eas: "0x4200000000000000000000000000000000000021",
      schema: "0x4200000000000000000000000000000000000020",
      multicall: "0xe385bd9592c6a9925aE114Ed81A2239EcD0592C0",
    },
    schemas: {
      Community:
        "0x14b016a56b56db47ee2cdda6963a3481374a75e1471dafd85a17e6e5c23d2a11",
      Details:
        "0xb42fc49d83421e9ab99460d4d6fd2a303fe2f645bc2b4d9946c8a867fd910da7",
      Grant:
        "0xda3e8e9a640f7dba210100f42ede411f3ca5d66386af3cac3ff69f1838c3322d",
      GrantRound:
        "0x7182a0d7e3935b321a61b1205616d7e97e2e87d09ffa1d3d64a1f98db06c6c0d",
      GrantVerified:
        "0x971078eb5ae59880c736ae06639daffc3d1186a51e7520ee694a2cb483cad850",
      ExternalLink:
        "0x8c7aa031d189d43a5a2b0dba0fdcecbd70bae545c7ec8e8e1ae127c9d5a1dc38",
      MemberOf:
        "0x83290964c6b4bffb8f2f8d8b896afa91847285c9044b025a94421167902bba44",
      MilestoneApproved:
        "0x971078eb5ae59880c736ae06639daffc3d1186a51e7520ee694a2cb483cad850",
      MilestoneCompleted:
        "0x971078eb5ae59880c736ae06639daffc3d1186a51e7520ee694a2cb483cad850",
      Project:
        "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
      Tag: "0x7182a0d7e3935b321a61b1205616d7e97e2e87d09ffa1d3d64a1f98db06c6c0d",
    },
  },
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
      multicall: "0x00Ee8a5082567c3da8f3D34D33ac8D788C4Cd754", // enhanced
      // multicall: "0x04D6BB799f5A8c76882C4372d1FC39Cd0DDA0A4c",// original
    },
    schemas: {
      Community:
        "0xf3d790c7fdab6c1b1f25ffcc9289e5be2792eb596d2851a4d059c8aae1bc8b2e", //test with resolver
      // "0x1954572e3fe21bf4334afdaf1358ed7098af1ed136e76dc93c2fdc25e83934c1", // original without resolver
      Details:
        "0x2c270e35bfcdc4d611f0e9d3d2ab6924ec6c673505abc22a1dd07e19b67211af",
      Grant:
        "0x09697aeeb3ae71de1cc19e388fd74264f11af5fba3016094764553ac341fdc72", // with communityUID/resolver
      GrantRound:
        "0xc12cb615e06369925ea707296b8ecd416c5bc9f80b6a36310fa2fc82ade82e66",
      GrantVerified:
        "0x0be8952e2dd74ffd63a02f4d55b20b603fe7a60130cb9d70de31feb9c52fdd37",
      ExternalLink:
        "0x981a9ee9346ddbd392f30d219e0e4ed5bdece14278aaf1f1ed3a68265c03208a",
      MemberOf:
        "0xdd87b3500457931252424f4439365534ba72a367503a8805ff3482353fb90301",
      MilestoneApproved:
        "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
      MilestoneCompleted:
        "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
      Project:
        "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
      Tag: "0xc12cb615e06369925ea707296b8ecd416c5bc9f80b6a36310fa2fc82ade82e66",
    },
  },
} as const;

const DetailsSchema = [{ type: "string", name: "json", value: null }];

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
    name: "CommunityDetails",
    schema: DetailsSchema,
    uid: network.schemas.Details,
    references: "Community",
  },
  Project: {
    name: "Project",
    schema: [{ type: "bool", name: "project", value: true }],
    uid: network.schemas.Project,
  },
  ProjectDetails: {
    name: "ProjectDetails",
    schema: DetailsSchema,
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
    name: "MemberDetails",
    schema: DetailsSchema,
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
    name: "GrantDetails",
    schema: DetailsSchema,
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
    name: "Milestone",
    schema: DetailsSchema,
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
    schema: DetailsSchema,
    name: "    schema",
    uid: network.schemas.Details,
  },
});
