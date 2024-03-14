import { ethers } from 'ethers';
import {
  Project,
  GAP,
  Grant,
  Hex,
  GapSchema,
  ProjectDetails,
  CommunityDetails,
} from './core';
import {
  Community,
  GapIndexerClient,
  IpfsStorage,
  RemoteStorage,
} from './core/class';
import axios from 'axios';

const key = require('./config/keys.json').sepolia;

// const web3 = new ethers.JsonRpcProvider(
//   'https://opt-sepolia.g.alchemy.com/v2/SAI_dJr86B7ttCD_b9fn61MWrrdZimmL'
//   // "https://eth-sepolia-public.unifra.io"
// );

const web3 = new ethers.AlchemyProvider("sepolia", "_M6YQg_DoVKuMisaFHSVZL-EcdkTbhUi");

const wallet = new ethers.Wallet(key, web3);
const gap = new GAP({
  network: 'optimism-sepolia',
  apiClient: new GapIndexerClient('http://192.168.123.101:3001'),
  gelatoOpts: {
    // env_gelatoApiKey: "GELATO_API_KEY",
    sponsorUrl: 'http://192.168.123.101:3001/attestations/sponsored-txn',
    apiKey: '{{apikey}}',
    useGasless: true,
  },
  remoteStorage: new IpfsStorage(
    {
      token: '',
    },
    {
      url: 'http://192.168.123.101:3001/ipfs',
      responseParser: (response: any) => response.cid,
    }
  ),
});

console.time('fetchSchemas');

const communityDetails = (community: Community) => ({
  uid: community.uid,
  name: community.details?.name,
  description: community.details?.description,
  imageURL: community.details?.imageURL,
});

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
  const [
    projectSchema,
    projectDetailsSchema,
    communitySchema,
    communityDetailsSchema,
  ] = GapSchema.findMany(
    ['Project', 'ProjectDetails', 'Community', 'CommunityDetails'],
    gap.network
  );

  // const community = new Community({
  //   data: {
  //     community: true,
  //   },
  //   recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
  //   schema: communitySchema,
  // });

  const details = new CommunityDetails({
    data: {
      name: 'Test Community',
      description: 'This is a test community',
      imageURL:
        'https://api.thegraph.com/ipfs/api/v0/cat?arg=QmdSeSQ3APFjLktQY3aNVu3M5QXPfE9ZRK5LqgghRgB7L9',
    },
    schema: communityDetailsSchema,
    recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
    refUID:
      '0x929de14333fe173c99cea73fe1356b0cd30041ef7b1752253105c60653fa1815',
  });

  await details.attest(wallet as any);

  return [details.uid];

  // const project = new Project({
  //   data: { project: true },
  //   schema: projectSchema,
  //   recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
  //   // uid: "0x0f290f88ef6b3838f83b49bd0c1eeb4bda31502d0aa4591470fac30abb2f0111",
  // });

  // project.details = new ProjectDetails({
  //   data: {
  //     title: 'Test Project 2',
  //     description: 'This is a test project',
  //     imageURL: 'https://i.imgur.com/2xX3t5B.jpeg',
  //     tags: [{ name: 'test' }, { name: 'test2' }],
  //   },
  //   schema: projectDetailsSchema,
  //   recipient: project.recipient,
  // });

  // await project.attest(wallet as any);

  // return [project.uid];
}

async function getProject(uid: Hex) {
  const project = await gap.fetch.projectById(uid);

  // await project.grants[0].milestones[0].complete(wallet as any);
  console.log(JSON.stringify(projectDetails([project]), null, 2));
}

async function getCommunity(uid: Hex) {
  const community = await gap.fetch.communityById(uid);

  // await project.grants[0].milestones[0].complete(wallet as any);
  console.log(JSON.stringify(communityDetails(community), null, 2));
}

// attestation().then((uids) => {
//   console.log(uids);
//   getCommunity(uids[0]);
// });



(async() => {
  const web3 = new ethers.AlchemyProvider("sepolia", "_M6YQg_DoVKuMisaFHSVZL-EcdkTbhUi");

  console.log('Web3: ', web3)
  const resolver = await GAP.getCommunityResolver((web3 as any), 11155111);
  const response = await resolver.isAdmin('0xc85c9f504e60550bc45e87ab71986c36f046e8f8aa8085bbe07d37825bcbb10a', '0x5a4830885f12438e00d8f4d98e9fe083e707698c');
  console.log({response})
})()
