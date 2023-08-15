import { SchemaInterface } from "./class/Schema";
import { EASNetworkConfig, TNetwork, TSchemaName } from "./types";

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
        "0x223856f6ed212325d5585fe903e952d76212047b52dc9d48b5e7d45682732a7a",
      GrantDetails: "",
      GrantRound: "",
      GrantVerified: "",
      Grantee: "",
      GranteeDetails: "",
      ExternalLink: "",
      MemberDetails: "",
      MemberOf: "",
      Milestone: "",
      MilestoneApproved: "",
      MilestoneCompleted: "",
      Project: "",
      ProjectDetails: "",
      Tag: "",
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
      { type: "address", name: "owner_address", value: null },
      { type: "address", name: "payout_address", value: null },
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
      { type: "string", name: "image_url", value: null },
    ],
    uid: network.schemas.ProjectDetails,
    references: "Project",
  },
  MemberOf: {
    name: "MemberOf",
    schema: [{ type: "bool", name: "member_of", value: true }],
    uid: network.schemas.MemberOf,
    references: "Project",
  },
  MemberDetails: {
    name: "MemberDetails",
    schema: [
      { type: "string", name: "name", value: null },
      { type: "string", name: "profile_picture_url", value: null },
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
      { type: "string", name: "proposal_url", value: null },
      { type: "string[]", name: "asset_chain_id", value: null },
    ],
    uid: network.schemas.GrantDetails,
    references: "Grant",
  },
  GrantVerified: {
    name: "GrantVerified",
    schema: [{ type: "bool", name: "grant_verified", value: true }],
    uid: network.schemas.GrantVerified,
    references: "Grant",
  },
  GrantRound: {
    name: "GrantRound",
    schema: [{ type: "bool", name: "grant_round", value: true }],
    uid: network.schemas.GrantRound,
    references: "Grant",
  },
  Milestone: {
    name: "Milestone",
    schema: [
      { type: "string", name: "title", value: null },
      { type: "uint16", name: "starts_at", value: null },
      { type: "uint16", name: "ends_at", value: null },
      { type: "string", name: "description", value: null },
    ],
    references: "Grant",
    uid: network.schemas.Milestone,
  },
  MilestoneApproved: {
    name: "MilestoneApproved",
    schema: [{ type: "bool", name: "milestone_approved", value: false }],
    uid: network.schemas.MilestoneApproved,
    references: "Milestone",
  },
  MilestoneCompleted: {
    name: "MilestoneCompleted",
    schema: [{ type: "bool", name: "milestone_completed", value: false }],
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
