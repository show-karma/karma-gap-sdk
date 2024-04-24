export type RoundMetadata = {
  name: string;
  support: {
    info: string;
    type: string;
  };
  roundType: "public" | string; // Could be extended to include other round types
  eligibility: {
    description: string;
    requirements: Array<{
      requirement: string;
    }>;
  };
  feesAddress: string;
  feesPercentage: number;
  programContractAddress: string;
  quadraticFundingConfig?: {
    matchingCap: boolean;
    sybilDefense: boolean;
    matchingCapAmount: number;
    minDonationThreshold: boolean;
    matchingFundsAvailable: number;
    minDonationThresholdAmount: number;
  };
};

export type Address = `0x${string}`;

export type GrantArgs = {
  profileId: Address;
  roundMetadata: RoundMetadata;
  applicationStart: number;
  applicationEnd: number;
  roundStart: number;
  roundEnd: number;
  // Use available payout tokens from this file:
  // https://github.dev/gitcoinco/grants-stack-indexer/blob/main/src/database/schema.ts
  matchingFundAmt: number;
  applicationMetadata: ApplicationMetadata;
  managers: Address[];
  strategy: Address;
  payoutToken: Address;
};

export type ApplicationMetadata = {
  version: string;
  lastUpdatedOn: number;
  applicationSchema: {
    questions: Array<{
      id: number;
      info: string;
      type:
        | "email"
        | "short-answer"
        | "link"
        | "number"
        | "paragraph"
        | "address"
        | "checkbox"
        | "multiple-choice";
      title: string;
      hidden: boolean;
      choices?: string[];
      required: boolean;
      encrypted: boolean;
    }>;
    requirements: {
      github: {
        required: boolean;
        verification: boolean;
      };
      twitter: {
        required: boolean;
        verification: boolean;
      };
      // Potentially add more requirements here if they exist in the data
    };
  };
};

export type ProfileMetadata = {
  title: string;
  description: string;
  website: string;
  projectTwitter: string;
  logoImg: string; // Assuming it's a URL to the logo image
  bannerImg: string; // Assuming it's a URL to the banner image
  logoImgData: any; // Could be object with image data or left as type 'any' if not used
  bannerImgData: any; // Could be object with image data or left as type 'any' if not used
  createdAt: number; // Timestamp in milliseconds
};
