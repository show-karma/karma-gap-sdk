import { ethers } from "ethers";
import { Project, GAP, Grant, Hex, GapSchema, ProjectDetails, GrantDetails, MemberDetails, CommunityDetails } from "./core";

import { Community, GapIndexerClient, MemberOf, Milestone } from "./core/class";
import { GapEasClient } from "./core/class/GraphQL/GapEasClient";

const key = require("./config/keys.json").sepolia;

const web3 = new ethers.providers.JsonRpcProvider(
  "https://goerli.optimism.io"
  // "https://eth-sepolia-public.unifra.io"
);

const wallet = new ethers.Wallet(key, web3);
const gap = GAP.createClient({
  network: 'optimism-goerli',
  // apiClient:  new GapEasClient({network: "optimism-goerli"}),
  apiClient: new GapIndexerClient('https://gapstagapi.karmahq.xyz'),
  gelatoOpts: {
    // env_gelatoApiKey: "GELATO_API_KEY",
    // sponsorUrl: 'https://gapstagapi.karmahq.xyz/attestations/sponsored-txn',
    // sponsorUrl: 'http://mint:3001/attestations/sponsored-txn',
    apiKey: 'lKg_9d1Vf0DewKRJb1XuaLg5t3TroYdA8l1Q9YFC_qI_',
    useGasless: true,
  },
  ipfsKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVkMjAzYTRFODc3ZjFlQTk2MzkzY2M5YjhDNUU4NUUxM2U5OWI5NzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwMDUxNTIzOTg5MSwibmFtZSI6IkdBUF9URVNUIn0.QwVmWPOXeDKCtWGFaLxGdllv-te1pKc4Jrj7rYlMdFk'
});

console.time("fetchSchemas");

const grantDetails = (grants: Grant[] = []) =>
  grants.map((g) => ({
    uid: g.uid,
    title: g.details?.title,
    refUID: g.refUID,
    milestones: g.milestones.map((m) => ({
      uid: m.uid,
      title: m.title,
      description: m.description,
      completed: { ...m.completed?.data },
      approved: { ...m.approved?.data },
      rejected: { ...m.rejected?.data },
    })),
    community: {
      uid: g?.community?.uid,
      name: g?.community?.details?.name,
    },
  }));

const projectDetails = (projects: Project[] = []) =>
  projects.map((p) => ({
    uid: p.uid,
    title: p.details?.title,
    description: p.details?.description,
    tags: p.details?.tags?.map((t) => t.name) || [],
    imageURL: p.details?.imageURL,
    members: p.members.map((m) => ({
      uid: m.uid,
      address: m.recipient,
      name: m.details?.name,
      profilePictureURL: m.details?.profilePictureURL,
    })),
    grants: grantDetails(p.grants),
  }));


  async function attestation() {
    const [project, projectDetails] = GapSchema.findMany([
      'Project',
      'ProjectDetails',
    ]);
  
    const com = new Community({
      data: { community: true },
      schema: GapSchema.find('Community'),
      recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
      // uid: '0xd93f13abc7b4c65331af75c723dc3183546195d73c5ca47e2001d77b28cd4259',
    });
  
    // await com.attest(wallet as any);
  
    com.details = new CommunityDetails({
      data: {
        name: 'Karma',
        description:
          'An integrated DAO toolkit to measure contributions and enhance Governance',
        imageURL: 'https://www.karmahq.xyz/images/karma-logo-dark.svg',
        slug: 'karma-hq',
      },
      schema: GapSchema.find('CommunityDetails'),
      refUID:
        '0xab4f129f54607b55ebe5d8fa103bc8e481e13d88e1be6446f9e830f19df38660',
      recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
    });
  
    // await com.attest(wallet as any);
    // await com.details.attest(wallet as any);
    // return [com.uid];
    // await com.details.revoke(wallet as any);
    // com.details.uid = nullRef;
    // await com.details.attest(wallet as any);
    // return [com.uid];
    // await com.details.attest(wallet as any);
  
    // if (com.details?.slug && (await gap.fetch.slugExists(com.details.slug))) {
    //   throw new Error("Slug url already in use.");
    // }
  
    // await com.attest(wallet as any);
    // console.log(communityDetails([await gap.fetch.communityById(com.uid)]));
  
    // return [com.uid];
  
    const pro = new Project({
      data: { project: true },
      schema: project,
      recipient: '0xd7d1DB401EA825b0325141Cd5e6cd7C2d01825f2',
      // uid: "0xe655c13f266c89bb4c46d740391bf9a9428de31cec1a674ee3b8b607c68f6b5d",
    });
  
    // await pro.attest(wallet as any);
  
    pro.details = new ProjectDetails({
      data: {
        title: 'GAP Indexer _ IPFS #1',
        description: 'Indexer to fetch data from GAP contracts and subgraphs.',
        imageURL: '',
        links: [
          {
            type: 'website',
            url: 'https://karmahq.xyz',
          },
          {
            type: 'twitter',
            url: 'https://twitter.com/karmahq_',
          },
          {
            type: 'discord',
            url: 'https://discord.gg/',
          },
          {
            type: 'github',
            url: 'https://github.com/show-karma/gap-sdk',
          },
        ],
        tags: [{ name: 'DAO' }, { name: 'UI/UX' }],
        slug: 'gap-indexer-project-ipfs#00',
      },
      schema: projectDetails,
      refUID: pro.uid,
      recipient: pro.recipient,
    });
  
    if (pro.details?.slug && (await gap.fetch.slugExists(pro.details?.slug))) {
      throw new Error('Project name already exists.');
    }
  
    // await pro.attest(wallet as any);
    // return [pro.uid];
  
    const memberA = new MemberOf({
      data: { memberOf: true },
      schema: GapSchema.find('MemberOf'),
      refUID: pro.uid,
      recipient: '0x8dC4057AD1768Cd070A1D77613017F14A377A8b4',
    });
  
    memberA.details = new MemberDetails({
      data: {
        name: 'Andre',
        profilePictureURL: 'https://loremflickr.com/320/240/kitten',
      },
      schema: GapSchema.find('MemberDetails'),
      refUID: memberA.uid,
      recipient: memberA.recipient,
    });
  
    // await memberA.attest(wallet as any);
  
    const memberB = new MemberOf({
      data: { memberOf: true },
      schema: GapSchema.find('MemberOf'),
      refUID: pro.uid,
      recipient: '0x1718Eaa3Aa6BEcBB7AF5b57eFa27F73E69A107A5',
    });
  
    memberB.details = new MemberDetails({
      data: {
        name: 'Amaury',
        profilePictureURL: 'https://loremflickr.com/320/240/car',
      },
      schema: GapSchema.find('MemberDetails'),
      refUID: memberB.uid,
      recipient: memberB.recipient,
    });
  
    // await memberB.attest(wallet as any);
  
    pro.members.push(memberA, memberB);
    // com.projects.push(pro);
  
    const grantA = new Grant({
      data: {
        communityUID: com.uid,
        // grant: true,
      },
      schema: GapSchema.find('Grant'),
      recipient: pro.recipient,
      refUID: pro.uid,
    });
  
    grantA.details = new GrantDetails({
      data: {
        title: 'Give $2000',
        proposalURL: 'https://pantera.com/',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        // communityUID: com.uid,
      },
      schema: GapSchema.find('GrantDetails'),
      recipient: pro.recipient,
    });
  
    // await grantA.attest(wallet as any);
  
    // await grantA.attest(wallet as any);
    // return [pro.uid];
  
    grantA.milestones = [
      new Milestone({
        data: {
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          title: 'Milestone A',
          endsAt: Date.now() + 1000000,
        },
        schema: GapSchema.find('Milestone'),
        recipient: pro.recipient,
        refUID: grantA.uid,
      }),
      new Milestone({
        data: {
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          title: 'Milestone B',
          endsAt: Date.now() + 1000000 * 2,
        },
        schema: GapSchema.find('Milestone'),
        recipient: pro.recipient,
      }),
      new Milestone({
        data: {
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          title: 'Milestone C',
          endsAt: Date.now() + 1000000 * 3,
        },
        schema: GapSchema.find('Milestone'),
        recipient: pro.recipient,
      }),
    ];
  
    // await pro.attest(wallet as any);
    // return [pro.uid];
  
    // await grantA.milestones[0].attest(wallet as any);
  
    const grantB = new Grant({
      data: {
        communityUID:
          '0x2c7c43d635c46ae903869be78c25a799d147df7ee8d7be619f9b25b59a6332fa',
      },
      schema: GapSchema.find('Grant'),
      recipient: pro.recipient,
    });
  
    grantB.details = new GrantDetails({
      data: {
        amount: '2000',
        title: '$2000',
        payoutAddress: pro.recipient,
        proposalURL: 'https://pantera.com/',
        assetAndChainId: ['0x4200000000000000000000000000000000000042', 10],
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      schema: GapSchema.find('GrantDetails'),
      recipient: pro.recipient,
    });
  
    grantB.milestones = [
      new Milestone({
        data: {
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          title: 'Milestone 1',
          endsAt: Date.now() + 1000000,
        },
        schema: GapSchema.find('Milestone'),
        recipient: pro.recipient,
      }),
    ];
  
    pro.grants.push(grantA, grantB);
  
    await pro.attest(wallet as any);
    return [pro.uid];
  }

async function getProject(uid: Hex) {
  const project = await gap.fetch.projectById(uid);

  // await project.grants[0].milestones[0].complete(wallet as any);
  console.log(JSON.stringify(projectDetails([project]), null, 2));
}

attestation().then((uids) => {
  console.log(uids);
  getProject(uids[0]);
});


