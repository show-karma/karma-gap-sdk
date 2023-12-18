"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MountEntities = exports.Networks = exports.zeroAddress = exports.nullResolver = exports.nullRef = exports.useDefaultAttestation = void 0;
/**
 * Schemas that should use default EAS attestation
 * instead of the custom contract.
 */
exports.useDefaultAttestation = [
    'MilestoneApproved',
    'MilestoneCompleted',
    'GrantVerified',
    'Community',
];
exports.nullRef = '0x0000000000000000000000000000000000000000000000000000000000000000';
// TODO: Remove null resolver and change usage to zero address
exports.nullResolver = '0x0000000000000000000000000000000000000000';
exports.zeroAddress = exports.nullResolver;
// resolver for dependents = 0xed081ABE885bc3575f810c904052A1f685A85903
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
    //     multicall:''
    //   },
    //   schemas: {
    //     Grant: "",
    //     GrantVerified: "",
    //     MemberOf: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
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
    //     GrantVerified: "",
    //     MemberOf: "",
    //     MilestoneApproved: "",
    //     MilestoneCompleted: "",
    //     Project: "",
    //   },
    // },
    optimism: {
        chainId: 10,
        url: 'https://optimism.easscan.org/graphql',
        rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl',
        contracts: {
            eas: '0x4200000000000000000000000000000000000021',
            schema: '0x4200000000000000000000000000000000000020',
            multicall: '0xd2eD366393FDfd243931Fe48e9fb65A192B0018c',
            projectResolver: '0x7177AdC0f924b695C0294A40C4C5FEFf5EE1E141',
            communityResolver: '0x6dC1D6b864e8BEf815806f9e4677123496e12026',
        },
        schemas: {
            Community: '0x721c17b065dccc5c916e0c2708d0ef50f1810591b76d0402ff6fe5accbd8488f',
            Details: '0x70a3f615f738fc6a4f56100692ada93d947c028b840940d97af7e7d6f0fa0577',
            Grant: '0x12837231f48acbca4e1e7f4416f684f3353bd4d71d4f03a09d29e5ffa6f21a50',
            GrantVerified: '0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93',
            MemberOf: '0x7fbb8a65924d8ad2ae12356e04b1418043e8361ba3b1b6c917de2e23df3ec81c',
            MilestoneApproved: '0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93',
            MilestoneCompleted: '0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93',
            Project: '0x5b873b6e7a16207b526dde366e8164e95bcda2f009272306519667c5e94d2191',
        },
    },
    'optimism-goerli': {
        chainId: 420,
        url: 'https://optimism-goerli-bedrock.easscan.org/graphql',
        rpcUrl: 'https://opt-goerli.g.alchemy.com/v2/94gBUTVw7SbDxxdeB8gi3KQmgQSD7SHi',
        contracts: {
            eas: '0x4200000000000000000000000000000000000021',
            schema: '0x4200000000000000000000000000000000000020',
            multicall: '0x5D5a8032b2FA06652804c33F60DcEA00e389B732',
            projectResolver: '0xbCf8910Bc3971eA59D93256357b76E846CF2e1F8',
            communityResolver: '0xa09369bDE7E4403a9C821AffA00E649cF85Ef09e'
        },
        schemas: {
            Community: '0xc1aade58410b3fd807c19845181996721248459c5f042284f27d21cec12a38d1',
            // "0x14b016a56b56db47ee2cdda6963a3481374a75e1471dafd85a17e6e5c23d2a11",
            Details: '0xfe590d9582957e10affbabcdc34a201785a1d4f77982d6616b736cce1a91ae43',
            Grant: '0xd6ce374765c355687101ba70b3f8824d555c12716d2bdad71a08ccad1ded3218',
            GrantVerified: '0xf544fbd9721ac50863d32dc0eed5992051e7fb270b38ab2ce062327cc0ae26ea',
            MemberOf: '0x78c811e506849d414a91a56dab91f07f7ed108f0bf27f550796f13e7bb2e2f2d',
            MilestoneApproved: '0xf544fbd9721ac50863d32dc0eed5992051e7fb270b38ab2ce062327cc0ae26ea',
            MilestoneCompleted: '0xf544fbd9721ac50863d32dc0eed5992051e7fb270b38ab2ce062327cc0ae26ea',
            Project: '0xa727441596f5a9878552d3ad6c53c31629a709451e6081ba01bff0f73bf1af5a',
        },
    },
    arbitrum: {
        chainId: 42161,
        url: 'https://arbitrum.easscan.org/graphql',
        rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/okcKBSKXvLuSCbas6QWGvKuh-IcHHSOr',
        contracts: {
            eas: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
            schema: '0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB',
            multicall: '0x6dC1D6b864e8BEf815806f9e4677123496e12026',
            projectResolver: '0x28BE0b0515be8BB8822aF1467A6613795E74717b',
            communityResolver: '0xD534C4704F82494aBbc901560046fB62Ac63E9C4'
        },
        schemas: {
            Community: '0xc604f0661cfd522583835ed2b2c644b80e068139d287f93c7f1680888894bacc',
            Details: '0x16bfe4783b7a9c743c401222c56a07ecb77ed42afc84b61ff1f62f5936c0b9d7',
            Grant: '0xea02ab33f9f4c92ba02c9bb21614b7410b98c940a0d8eb8ad3a20204d8b4bda5',
            GrantVerified: '0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15',
            MemberOf: '0x5f430aec9d04f0dcb3729775c5dfe10752e436469a7607f8c64ae44ef996e477',
            MilestoneApproved: '0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15',
            MilestoneCompleted: '0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15',
            Project: '0xac2a06e955a7e25e6729efe1a6532237e3435b21ccd3dc827ae3c94e624d25b3',
        },
    },
    sepolia: {
        chainId: 11155111,
        url: 'https://sepolia.easscan.org/graphql',
        rpcUrl: 'https://rpc.sepolia.io',
        contracts: {
            eas: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
            schema: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
            multicall: '0xec8d7BFe344790FD860920C41B46B259c005727A',
            projectResolver: '0x099787D5a5aC92779A519CfD925ACB0Dc7E8bd23',
            communityResolver: '0xa9E55D9F52d7B47792d2Db15F6A9674c56ccc5C9'
        },
        schemas: {
            Community: '0xf3d790c7fdab6c1b1f25ffcc9289e5be2792eb596d2851a4d059c8aae1bc8b2e',
            // "0x1954572e3fe21bf4334afdaf1358ed7098af1ed136e76dc93c2fdc25e83934c1", // original without resolver
            Details: '0x2c270e35bfcdc4d611f0e9d3d2ab6924ec6c673505abc22a1dd07e19b67211af',
            Grant: '0x09697aeeb3ae71de1cc19e388fd74264f11af5fba3016094764553ac341fdc72',
            GrantVerified: '0x0be8952e2dd74ffd63a02f4d55b20b603fe7a60130cb9d70de31feb9c52fdd37',
            MemberOf: '0xdd87b3500457931252424f4439365534ba72a367503a8805ff3482353fb90301',
            MilestoneApproved: '0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322',
            MilestoneCompleted: '0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322',
            Project: '0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb',
        },
    },
};
const DetailsSchema = [{ type: 'string', name: 'json', value: null }];
/**
 * Mounts the schemas for the given network and return all the settings
 * @param network
 * @returns
 */
const MountEntities = (network) => ({
    Community: {
        name: 'Community',
        schema: [{ type: 'bool', name: 'community', value: true }],
        uid: network.schemas.Community,
    },
    CommunityDetails: {
        name: 'CommunityDetails',
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: 'Community',
    },
    Project: {
        name: 'Project',
        schema: [{ type: 'bool', name: 'project', value: true }],
        uid: network.schemas.Project,
    },
    ProjectDetails: {
        name: 'ProjectDetails',
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: 'Project',
    },
    MemberOf: {
        name: 'MemberOf',
        schema: [{ type: 'bool', name: 'memberOf', value: true }],
        uid: network.schemas.MemberOf,
        references: 'Project',
    },
    MemberDetails: {
        name: 'MemberDetails',
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: 'MemberOf',
    },
    Grant: {
        name: 'Grant',
        schema: [{ type: 'bytes32', name: 'communityUID', value: true }],
        // schema: [{ type: "bool", name: "grant", value: true }],
        uid: network.schemas.Grant,
        references: 'Project',
    },
    GrantDetails: {
        name: 'GrantDetails',
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: 'Grant',
    },
    GrantVerified: {
        name: 'GrantVerified',
        schema: [
            { type: 'string', name: 'type', value: null },
            { type: 'string', name: 'reason', value: '' },
        ],
        uid: network.schemas.GrantVerified,
        references: 'Grant',
    },
    Milestone: {
        name: 'Milestone',
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: 'Grant',
    },
    MilestoneApproved: {
        name: 'MilestoneApproved',
        schema: [
            { type: 'string', name: 'type', value: null },
            { type: 'string', name: 'reason', value: '' },
        ],
        uid: network.schemas.MilestoneApproved,
        references: 'Milestone',
    },
    MilestoneCompleted: {
        name: 'MilestoneCompleted',
        schema: [
            { type: 'string', name: 'type', value: null },
            { type: 'string', name: 'reason', value: '' },
        ],
        uid: network.schemas.MilestoneCompleted,
        references: 'Milestone',
    },
    Details: {
        schema: DetailsSchema,
        name: '    schema',
        uid: network.schemas.Details,
    },
});
exports.MountEntities = MountEntities;
