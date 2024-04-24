export type RoundMetadata = {
    name: string;
    support: {
        info: string;
        type: string;
    };
    roundType: "public" | string;
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
            type: "email" | "short-answer" | "link" | "number" | "paragraph" | "address" | "checkbox" | "multiple-choice";
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
        };
    };
};
export type ProfileMetadata = {
    title: string;
    description: string;
    website: string;
    projectTwitter: string;
    logoImg: string;
    bannerImg: string;
    logoImgData: any;
    bannerImgData: any;
    createdAt: number;
};
