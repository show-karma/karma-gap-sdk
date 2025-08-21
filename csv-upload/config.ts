import { ChainConfig } from "./types";

export const CHAIN_IDS: ChainConfig = {
  optimism: 10,
  "optimism-sepolia": 11155420,
  sepolia: 11155111,
  arbitrum: 42161,
};

export const DEFAULT_CONFIG = {
  DEFAULT_OWNER_ADDRESS: "0x23B7A53ecfd93803C63b97316D7362eae59C55B6",
  DEFAULT_NETWORK: "optimism-sepolia" as const,
  CSV_PROCESSING: {
    DELAY_BETWEEN_ITEMS_MS: 2000,
    ELLIPSIS_LIMIT: 100,
  },
  ENS_REGEX: /^\w+\.(eth)$/,
  HEX_REGEX: /^0x[a-fA-F0-9]{64}$/,
};

export const API_ENDPOINTS = {
  ATTESTATIONS: "/attestations",
  PROJECTS: {
    CHECK: "/projects/check",
  },
  GRANTS: {
    EXTERNAL_ID: {
      BULK_UPDATE: "/grants/external-id/bulk-update",
    },
  },
};

export const LINK_TYPES = {
  WEBSITE: "website",
  TWITTER: "twitter",
  GITHUB: "github",
} as const;

export const GRANT_UPDATE_TYPES = {
  GRANT_UPDATE: "grant-update",
} as const;
