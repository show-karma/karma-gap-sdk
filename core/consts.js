"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = void 0;
exports.Network = {
    mainnet: {
        url: "https://easscan.org/graphql",
        chainId: 1,
        contracts: {
            eas: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
            schema: "0xA7b39296258348C78294F95B872b282326A97BDF",
        },
    },
    "base-goerli": {
        chainId: 5,
        url: "https://base-goerli.easscan.org/graphql",
        contracts: {
            eas: "0xAcfE09Fd03f7812F022FBf636700AdEA18Fd2A7A",
            schema: "0x720c2bA66D19A725143FBf5fDC5b4ADA2742682E",
        },
    },
    optimism: {
        chainId: 10,
        url: "https://optimism.easscan.org/graphql",
        contracts: {
            eas: "0x4200000000000000000000000000000000000021",
            schema: "0x4200000000000000000000000000000000000020",
        },
    },
    "optimism-goerli": {
        chainId: 420,
        url: "https://optimism-goerli-bedrock.easscan.org/graphql",
        contracts: {
            eas: "0x4200000000000000000000000000000000000021",
            schema: "0x4200000000000000000000000000000000000020",
        },
    },
    arbitrum: {
        chainId: 42161,
        url: "https://arbitrum.easscan.org/graphql",
        contracts: {
            eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
            schema: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB",
        },
    },
    sepolia: {
        chainId: 11155111,
        url: "https://sepolia.easscan.org/graphql",
        contracts: {
            eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
            schema: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
        },
    },
};
