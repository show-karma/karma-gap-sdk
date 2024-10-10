"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlloContracts = exports.alloSupportedNetworks = exports.MountEntities = exports.Networks = exports.zeroAddress = exports.nullResolver = exports.nullRef = exports.chainIdToNetwork = exports.useDefaultAttestation = void 0;
const oldStatusSchema = [
    { type: "string", name: "type", value: null },
    { type: "string", name: "reason", value: null },
];
/**
 * Schemas that should use default EAS attestation
 * instead of the custom contract.
 */
exports.useDefaultAttestation = [
    "MilestoneApproved",
    "MilestoneCompleted",
    "GrantVerified",
    "Community",
    "GrantUpdateStatus",
    "ProjectUpdateStatus",
];
exports.chainIdToNetwork = {
    11155420: "optimism-sepolia",
    42161: "arbitrum",
    10: "optimism",
    11155111: "sepolia",
    84532: "base-sepolia",
    42220: "celo",
    1328: "sei-testnet",
    1329: "sei",
};
exports.nullRef = "0x0000000000000000000000000000000000000000000000000000000000000000";
// TODO: Remove null resolver and change usage to zero address
exports.nullResolver = "0x0000000000000000000000000000000000000000";
exports.zeroAddress = exports.nullResolver;
// resolver for dependents = 0xed081ABE885bc3575f810c904052A1f685A85903
/**
 * The networks that are supported by the EAS
 */
exports.Networks = {
    optimism: {
        chainId: 10,
        url: "https://optimism.easscan.org/graphql",
        rpcUrl: "https://opt-mainnet.g.alchemy.com/v2/fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl",
        contracts: {
            eas: "0x4200000000000000000000000000000000000021",
            schema: "0x4200000000000000000000000000000000000020",
            multicall: "0xd2eD366393FDfd243931Fe48e9fb65A192B0018c",
            projectResolver: "0x7177AdC0f924b695C0294A40C4C5FEFf5EE1E141",
            communityResolver: "0x6dC1D6b864e8BEf815806f9e4677123496e12026",
            donations: "0x021896771412C1D3f31BC7B01fFA3a6A17c5dA30",
            airdropNFT: "0x2bB9aB0084477c1306A7da80f5DCDdBca4139112",
        },
        schemas: {
            Community: "0x721c17b065dccc5c916e0c2708d0ef50f1810591b76d0402ff6fe5accbd8488f",
            Details: "0x70a3f615f738fc6a4f56100692ada93d947c028b840940d97af7e7d6f0fa0577",
            Grant: "0x12837231f48acbca4e1e7f4416f684f3353bd4d71d4f03a09d29e5ffa6f21a50",
            GrantVerified: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            MemberOf: "0x7fbb8a65924d8ad2ae12356e04b1418043e8361ba3b1b6c917de2e23df3ec81c",
            MilestoneApproved: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            MilestoneCompleted: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            GrantUpdateStatus: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            Project: "0x5b873b6e7a16207b526dde366e8164e95bcda2f009272306519667c5e94d2191",
            ProjectUpdateStatus: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            ProjectMilestoneStatus: "0xdc3f4d0938b1d029d825c01b3c53ad955e0ef3eabc1f57c1ebde90de2bf527ae",
            ContributorProfile: "0x"
        },
        oldSchemas: [
            {
                name: "GrantVerified",
                uid: "0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneApproved",
                uid: "0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneCompleted",
                uid: "0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93",
                raw: oldStatusSchema
            },
            {
                name: "GrantUpdateStatus",
                uid: "0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93",
                raw: oldStatusSchema
            },
            {
                name: "ProjectUpdateStatus",
                uid: "0x13adc8df8a7324b1651e8bcec948b3e2d4fcfa2a88a52136206cb9ea44836e93",
                raw: oldStatusSchema
            },
        ]
    },
    "optimism-sepolia": {
        chainId: 11155420,
        url: "https://optimism-sepolia.easscan.org/graphql",
        rpcUrl: "https://opt-sepolia.g.alchemy.com/v2/9FEqTNKmgO7X7ll92ALJrEih7Jjhldf-",
        contracts: {
            communityResolver: "0xa5B7bbFD545A1a816aa8cBE28a1F0F2Cca58363d",
            eas: "0x4200000000000000000000000000000000000021",
            multicall: "0xC891F8eBA218f5034bf3a472528408BE19E1130E",
            projectResolver: "0x832931F23ea4e3c70957DA71a7eB50F5B7efA93D",
            schema: "0x4200000000000000000000000000000000000020",
            donations: "0x3caF83Ed040501f1f439fb22E198bB5a67Bc2884",
            airdropNFT: "0x57d6A954E051145D7E9dD81decaeA6d7Feb640ee",
        },
        schemas: {
            Community: "0x314bb1c3c9b5311c1b813a3ad123b6ac5a03902b987795056dd2e4ff38e833ea",
            Details: "0xd193e75f420a69910f98fa79cacdfd9d0dcbf5933edce8f8bde9a10bd204d996",
            Grant: "0x181beb00ef05cf99caa2e4192369232f210c2764f26e238d962112bf592e9cce",
            GrantVerified: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            MemberOf: "0x611f9655188f372e27dce116a803fa9081ca3e2907986368d54fcad538ca3853",
            MilestoneApproved: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            MilestoneCompleted: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            GrantUpdateStatus: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            Project: "0xf9bbd118dd100459a7d093403af21c6e7f847fd7f331b7a4e6bfb94a1366bd76",
            ProjectUpdateStatus: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            ProjectMilestoneStatus: "0x6f8e6a1394bdc398f8d93a99b0ecca326d04470a4f0ee5c379bb85a458a322e4",
            ContributorProfile: "0x18f95014ea1249287fa962a42bc5a1d023b42133ee28ec90730939ec082f8daf"
        },
        oldSchemas: [
            {
                name: "GrantVerified",
                uid: "0xf9ec600d61d88614c863365a79715a7ba29781ec67643ffeb9222dd8873ee3fa",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneApproved",
                uid: "0xf9ec600d61d88614c863365a79715a7ba29781ec67643ffeb9222dd8873ee3fa",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneCompleted",
                uid: "0xf9ec600d61d88614c863365a79715a7ba29781ec67643ffeb9222dd8873ee3fa",
                raw: oldStatusSchema
            },
            {
                name: "GrantUpdateStatus",
                uid: "0xf9ec600d61d88614c863365a79715a7ba29781ec67643ffeb9222dd8873ee3fa",
                raw: oldStatusSchema
            },
            {
                name: "ProjectUpdateStatus",
                uid: "0xf9ec600d61d88614c863365a79715a7ba29781ec67643ffeb9222dd8873ee3fa",
                raw: oldStatusSchema
            },
        ]
    },
    arbitrum: {
        chainId: 42161,
        url: "https://arbitrum.easscan.org/graphql",
        rpcUrl: "https://arb-mainnet.g.alchemy.com/v2/okcKBSKXvLuSCbas6QWGvKuh-IcHHSOr",
        contracts: {
            eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
            schema: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB",
            multicall: "0x6dC1D6b864e8BEf815806f9e4677123496e12026",
            projectResolver: "0x28BE0b0515be8BB8822aF1467A6613795E74717b",
            communityResolver: "0xD534C4704F82494aBbc901560046fB62Ac63E9C4",
            donations: "0x475F3E915601d975c792E6116791FBe9ACdBE902",
            airdropNFT: "0xe957aFd24F91e6A14F4d47E801d70b876176772a",
        },
        schemas: {
            Community: "0xc604f0661cfd522583835ed2b2c644b80e068139d287f93c7f1680888894bacc",
            Details: "0x16bfe4783b7a9c743c401222c56a07ecb77ed42afc84b61ff1f62f5936c0b9d7",
            Grant: "0xea02ab33f9f4c92ba02c9bb21614b7410b98c940a0d8eb8ad3a20204d8b4bda5",
            GrantVerified: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            MemberOf: "0x5f430aec9d04f0dcb3729775c5dfe10752e436469a7607f8c64ae44ef996e477",
            MilestoneApproved: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            MilestoneCompleted: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            GrantUpdateStatus: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            Project: "0xac2a06e955a7e25e6729efe1a6532237e3435b21ccd3dc827ae3c94e624d25b3",
            ProjectUpdateStatus: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            ProjectMilestoneStatus: "0x93391c496898c63995f23797835c8e0468be338f0dbc2df62edfd70856cde1d4",
            ContributorProfile: "0x"
        },
        oldSchemas: [
            {
                name: "GrantVerified",
                uid: "0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneApproved",
                uid: "0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneCompleted",
                uid: "0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15",
                raw: oldStatusSchema
            },
            {
                name: "GrantUpdateStatus",
                uid: "0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15",
                raw: oldStatusSchema
            },
            {
                name: "ProjectUpdateStatus",
                uid: "0xd25ccdfbf87659a9081681eb90598d8b944ed28544da7d57c3ccbe6e6422cc15",
                raw: oldStatusSchema
            },
        ]
    },
    sepolia: {
        chainId: 11155111,
        url: "https://sepolia.easscan.org/graphql",
        rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/_M6YQg_DoVKuMisaFHSVZL-EcdkTbhUi",
        contracts: {
            eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
            schema: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
            multicall: "0xec8d7BFe344790FD860920C41B46B259c005727A",
            projectResolver: "0x099787D5a5aC92779A519CfD925ACB0Dc7E8bd23",
            communityResolver: "0xa9E55D9F52d7B47792d2Db15F6A9674c56ccc5C9",
            donations: "0xb2021F7550b8B07cA71696159B592C1F713593e4",
            airdropNFT: "0x11f48e68Ff894D417956839263337a2989822703",
        },
        schemas: {
            Community: "0xf3d790c7fdab6c1b1f25ffcc9289e5be2792eb596d2851a4d059c8aae1bc8b2e",
            // "0x1954572e3fe21bf4334afdaf1358ed7098af1ed136e76dc93c2fdc25e83934c1", // original without resolver
            Details: "0x2c270e35bfcdc4d611f0e9d3d2ab6924ec6c673505abc22a1dd07e19b67211af",
            Grant: "0x09697aeeb3ae71de1cc19e388fd74264f11af5fba3016094764553ac341fdc72",
            GrantVerified: "0x0be8952e2dd74ffd63a02f4d55b20b603fe7a60130cb9d70de31feb9c52fdd37",
            MemberOf: "0xdd87b3500457931252424f4439365534ba72a367503a8805ff3482353fb90301",
            MilestoneApproved: "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
            MilestoneCompleted: "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
            GrantUpdateStatus: "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
            Project: "0xec77990a252b54b17673955c774b9712766de5eecb22ca5aa2c440e0e93257fb",
            ProjectUpdateStatus: "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
            ProjectMilestoneStatus: "0xcdef0e492d2e7ad25d0b0fdb868f6dcd1f5e5c30e42fd5fa0debdc12f7618322",
            ContributorProfile: "0x"
        },
    },
    "base-sepolia": {
        chainId: 84532,
        url: "https://base-sepolia.easscan.org/graphql",
        rpcUrl: "https://sepolia.base.org",
        contracts: {
            eas: "0x4200000000000000000000000000000000000021",
            schema: "0x4200000000000000000000000000000000000020",
            multicall: "0x4Ca7230fB6b78875bdd1B1e4F665B7B7f1891239",
            projectResolver: "0xC891F8eBA218f5034bf3a472528408BE19E1130E",
            communityResolver: "0x009dC7dF3Ea3b23CE80Fd3Ba811d5bA5675934A1",
            donations: "0x61eD6D070EE996698fB35B909e45111402336645",
            airdropNFT: "0xa9c31794385A217832D4C8E200CfA6A8da9c7B32",
        },
        schemas: {
            Community: "0xe130107659909d20cbd75a2c82e1988b09b1c08fd39ad6f4397ce27c089e0e95",
            Details: "0x9b06f811608d135f913c18295486693fe626f35e213a7d132be87b1f952e508c",
            Grant: "0x2fb93aac9ef8450a5f615ac6916684d50978ea2a405ac5f918d6d9f367366a78",
            GrantVerified: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            MemberOf: "0x857398d86e2d31bec5af882b950ee7b00d1fefefba2432737ab28b68ee041eb8",
            MilestoneApproved: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            MilestoneCompleted: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            GrantUpdateStatus: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            Project: "0x5ddd6b7a11406771308431ca9bd146cc717848b74b52993a532dc1aad0ccc83f",
            ProjectUpdateStatus: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            ProjectMilestoneStatus: "0xe9cce07bd9295aafc78faa7afdd88a6fad6fd61834a048fb8c3dbc86cb471f81",
            ContributorProfile: "0x"
        },
    },
    celo: {
        chainId: 42220,
        url: "https://celo.easscan.org/graphql",
        rpcUrl: "https://forno.celo.org",
        contracts: {
            eas: "0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92",
            schema: "0x5ece93bE4BDCF293Ed61FA78698B594F2135AF34",
            multicall: "0x8791Ac8c099314bB1D1514D76de13a1E80275950",
            projectResolver: "0x6dC1D6b864e8BEf815806f9e4677123496e12026",
            communityResolver: "0xfddb660F2F1C27d219372210745BB9f73431856E",
            donations: "0xf373467c21841DF20529FAA8bE49381106DBc258",
            airdropNFT: "0x884F839fA169B5ECfF5d65CA600C2B43C1F6f668",
        },
        schemas: {
            Community: "0x3c2231024f4f17f3718b5bd9ed9ff29cc323dea5449f9ceba11a9888bfbdd0e1",
            Details: "0x9895e82115987d8e3e02b35ced92e6a0509293890333f58f50ec291b34853dac",
            Grant: "0x7afa603a89cee2d8f93d30007e2c64efddc6509fd76aa95d2ccd97b6e34acc71",
            GrantVerified: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            MemberOf: "0xb4186a2401f40a4c78768941ef9140e1fbe5fe595053a65d44f31d6df180b712",
            MilestoneApproved: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            MilestoneCompleted: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            GrantUpdateStatus: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            Project: "0xf3f753b41e04d1052b5a5ec7624d1dfdb6c2da288a985120e477ddbcac071022",
            ProjectUpdateStatus: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            ProjectMilestoneStatus: "0x80f0701853e862d920f87e8ae5b359a1625ad417a9523af2ed12bc3504b04088",
            ContributorProfile: "0x"
        },
        oldSchemas: [
            {
                name: "GrantVerified",
                uid: "0xf45fdf2c064073f0623416571c2746085d785cde5a57fd0696ff88bdf78bcbdc",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneApproved",
                uid: "0xf45fdf2c064073f0623416571c2746085d785cde5a57fd0696ff88bdf78bcbdc",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneCompleted",
                uid: "0xf45fdf2c064073f0623416571c2746085d785cde5a57fd0696ff88bdf78bcbdc",
                raw: oldStatusSchema
            },
            {
                name: "GrantUpdateStatus",
                uid: "0xf45fdf2c064073f0623416571c2746085d785cde5a57fd0696ff88bdf78bcbdc",
                raw: oldStatusSchema
            },
            {
                name: "ProjectUpdateStatus",
                uid: "0xf45fdf2c064073f0623416571c2746085d785cde5a57fd0696ff88bdf78bcbdc",
                raw: oldStatusSchema
            },
        ]
    },
    sei: {
        chainId: 1329,
        url: "https://sei.easscan.org/graphql",
        rpcUrl: "https://muddy-orbital-arrow.sei-pacific.quiknode.pro/594552c3ab4ed4106b40402c16dba137ab279d40",
        contracts: {
            eas: "0x391020888b0adBA584A67693458b374e4141f838",
            schema: "0x80A4B50f549a8271e10A6C8e79172cb56f35fD57",
            multicall: "0xB80D85690747C3E2ceCc0f8529594C6602b642D5",
            projectResolver: "0x96f36F25C6bD648d9bdBbd8C3E029CfB2394754d",
            communityResolver: "0x61d519C99279DC91fC2FC56B177f42B90B35050E",
            donations: "0xB80D85690747C3E2ceCc0f8529594C6602b642D5",
            airdropNFT: "0xfced53EA1b05F0ef10f86757933cbD4A4e6D9c6e",
        },
        schemas: {
            Community: "0x57dee0b7e1aa8e5c6280c27fecf2edeb225f1b87b47e2750f9dc7eaebe57a2ba",
            Details: "0x1b4365b92aa47de3f67cdfb53127518381c1e66e0d9e0f8a15bbfa7250950967",
            Grant: "0xe9030dc574039832103dd5939f9dd214340602d2af4bbf1c8b2666e720ed0bf6",
            GrantVerified: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            MemberOf: "0xb7278b94cea2b9f1a8fdd1c4bb52ed66906516a0ff9d59d0f80daffcf147ea5d",
            MilestoneApproved: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            MilestoneCompleted: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            GrantUpdateStatus: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            Project: "0xf6b89107f8096220051240b89a48abb66e0a23e529c914953b80f5a2bc5ea44c",
            ProjectUpdateStatus: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            ProjectMilestoneStatus: "0xc3b9bee0be3a6ea92f76fa459922a088824e29798becdc82d81f6b2309442563",
            ContributorProfile: "0x"
        },
        oldSchemas: [
            {
                name: "GrantVerified",
                uid: "0x6edc90af92553109cfed1292a67a75b34e41880bd8a61e9d05db0473b69a2f9e",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneApproved",
                uid: "0x6edc90af92553109cfed1292a67a75b34e41880bd8a61e9d05db0473b69a2f9e",
                raw: oldStatusSchema
            },
            {
                name: "MilestoneCompleted",
                uid: "0x6edc90af92553109cfed1292a67a75b34e41880bd8a61e9d05db0473b69a2f9e",
                raw: oldStatusSchema
            },
            {
                name: "GrantUpdateStatus",
                uid: "0x6edc90af92553109cfed1292a67a75b34e41880bd8a61e9d05db0473b69a2f9e",
                raw: oldStatusSchema
            },
            {
                name: "ProjectUpdateStatus",
                uid: "0x6edc90af92553109cfed1292a67a75b34e41880bd8a61e9d05db0473b69a2f9e",
                raw: oldStatusSchema
            },
        ]
    },
    "sei-testnet": {
        chainId: 1328,
        url: "https://sei-testnet.easscan.org/graphql",
        rpcUrl: "https://evm-rpc-testnet.sei-apis.com",
        contracts: {
            eas: "0x4F166ed0A038ECdEEefa7Dc508f15991762974Fe",
            schema: "0x906a57aCa067178e76e6eBDF4C7b26CBcAEC0Edd",
            multicall: "0x0bB232f1b137fB55CB6af92c218A1cD63445a2E9",
            projectResolver: "0xdA2c62101851365EEdC5A1f7087d92Ffde7345B4",
            communityResolver: "0x50fb4a65CE924D29b9AC8C508c376a5a21Fda1BC",
            donations: "0xB80D85690747C3E2ceCc0f8529594C6602b642D5",
            airdropNFT: "0x00933B581765d638369cd8A10a4583c275a857A6",
        },
        schemas: {
            Community: "0x968fe3d635bbf22b6253596df6290d1b6da1f192da9e2b5b41ae3595a965dbc2",
            Details: "0x76f38d22f88a0df52a8ff0763e1c0af912b0822e758be2e0c9cded91aef71d22",
            Grant: "0xfd5af4f0abd2875c64d2fed8be07bc1dfa5192a49e1a80587b0f12cae8d5173f",
            GrantVerified: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            MemberOf: "0x222fa508c0cdb5954905dd30611a940f6402da2b3c49ce0c88d33e22f72121e7",
            MilestoneApproved: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            MilestoneCompleted: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            GrantUpdateStatus: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            Project: "0x9de9294fbb62391b393332a33bfc28b4e0e728dd094aee4bda3955df62f8401a5",
            ProjectUpdateStatus: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            ProjectMilestoneStatus: "0xb25551d21dc886be83a07c241c46de318704cb6f485191fdedcf80f4b8b28188",
            ContributorProfile: "0x"
        },
    },
};
const DetailsSchema = [{ type: "string", name: "json", value: null }];
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
        oldSchemas: network.oldSchemas?.filter(s => s.name === "Community")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    CommunityDetails: {
        name: "CommunityDetails",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Community",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "CommunityDetails")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    Project: {
        name: "Project",
        schema: [{ type: "bool", name: "project", value: true }],
        uid: network.schemas.Project,
        oldSchemas: network.oldSchemas?.filter(s => s.name === "Project")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectDetails: {
        name: "ProjectDetails",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectDetails")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    MemberOf: {
        name: "MemberOf",
        schema: [{ type: "bool", name: "memberOf", value: true }],
        uid: network.schemas.MemberOf,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "MemberOf")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    MemberDetails: {
        name: "MemberDetails",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "MemberOf",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "MemberDetails")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    Grant: {
        name: "Grant",
        schema: [{ type: "bytes32", name: "communityUID", value: true }],
        // schema: [{ type: "bool", name: "grant", value: true }],
        uid: network.schemas.Grant,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "Grant")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    GrantDetails: {
        name: "GrantDetails",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Grant",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "GrantDetails")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    GrantVerified: {
        name: "GrantVerified",
        schema: DetailsSchema,
        uid: network.schemas.GrantVerified,
        references: "Grant",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "GrantVerified")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    Milestone: {
        name: "Milestone",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Grant",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "Milestone")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    MilestoneApproved: {
        name: "MilestoneApproved",
        schema: DetailsSchema,
        uid: network.schemas.MilestoneApproved,
        references: "Milestone",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "MilestoneApproved")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    MilestoneCompleted: {
        name: "MilestoneCompleted",
        schema: DetailsSchema,
        uid: network.schemas.MilestoneCompleted,
        references: "Milestone",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "MilestoneCompleted")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    Details: {
        schema: DetailsSchema,
        name: "    schema",
        uid: network.schemas.Details,
        oldSchemas: network.oldSchemas?.filter(s => s.name === "DetailsSchema")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectImpact: {
        name: "ProjectImpact",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectImpact")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    GrantUpdate: {
        name: "GrantUpdate",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Grant",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "GrantUpdate")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    GrantUpdateStatus: {
        name: "GrantUpdateStatus",
        schema: DetailsSchema,
        uid: network.schemas.GrantUpdateStatus,
        references: "GrantUpdate",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "GrantUpdateStatus")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectEndorsement: {
        name: "ProjectEndorsement",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectEndorsement")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectUpdate: {
        name: "ProjectUpdate",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectUpdate")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectUpdateStatus: {
        name: "ProjectUpdateStatus",
        schema: DetailsSchema,
        uid: network.schemas.ProjectUpdateStatus,
        references: "ProjectUpdate",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectUpdateStatus")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectPointer: {
        name: "ProjectPointer",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectPointer")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectMilestone: {
        name: "ProjectMilestone",
        schema: DetailsSchema,
        uid: network.schemas.Details,
        references: "Project",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectMilestone")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ProjectMilestoneStatus: {
        name: "ProjectMilestoneStatus",
        schema: DetailsSchema,
        uid: network.schemas.ProjectUpdateStatus,
        references: "ProjectMilestone",
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ProjectMilestoneStatus")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
    ContributorProfile: {
        name: "ContributorProfile",
        schema: DetailsSchema,
        uid: network.schemas.ContributorProfile,
        oldSchemas: network.oldSchemas?.filter(s => s.name === "ContributorProfile")?.map(s => ({ uid: s.uid, raw: s.raw }))
    },
});
exports.MountEntities = MountEntities;
exports.alloSupportedNetworks = {
    mainnet: [1, 10, 250, 42220, 42161, 8453, 137, 43114, 534352],
    testnet: [11155111, 11155420, 4002, 44787, 421614, 80001, 43113],
};
exports.AlloContracts = {
    registry: "0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3",
    alloProxy: "0x1133eA7Af70876e64665ecD07C0A0476d09465a1",
    alloImplementation: "0xB087535DB0df98fC4327136e897A5985E5Cfbd66",
    strategy: {
        DonationVotingMerkleDistributionDirectTransferStrategy: "0x787eC93Dd71a90563979417879F5a3298389227f",
        DirectGrantsSimpleStrategy: "0x8564d522b19836b7f5b4324e7ee8cb41810e9f9e",
        RFPSimpleStrategy: "0xc0379c3e6e3140cae35588c09e081f2d8529c7e3",
        RFPCommitteeStrategy: "0x8def91f220f3d1c16d406097ffb0daee0732772f",
        QVSimple: "0xa9e9110fe3b4b169b2ca0e8825c7ce76eb0b9438",
    },
    factory: "0xE195743480D1591B79106FF9B296A0cD38aDa807",
};
