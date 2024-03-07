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

const web3 = new ethers.JsonRpcProvider(
  // 'https://sepolia.optimism.io'
  "https://opt-sepolia.g.alchemy.com/v2/9FEqTNKmgO7X7ll92ALJrEih7Jjhldf-",
  // "https://eth-sepolia-public.unifra.io"
);

const wallet = new ethers.Wallet(key, web3);
const gap = new GAP({
  network: 'optimism-sepolia',
  apiClient: new GapIndexerClient('http://192.168.0.100:3002'),
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


  const project = new Project({
    data: { project: true },
    schema: projectSchema,
    recipient: '0x5A4830885f12438E00D8f4d98e9Fe083e707698C',
    // uid: "0x0f290f88ef6b3838f83b49bd0c1eeb4bda31502d0aa4591470fac30abb2f0111",
  });

  project.details = new ProjectDetails({
    data: {
      title: 'Test Project 21231321321312',
      description: 'This is a test project',
      imageURL: 'https://i.imgur.com/2xX3t5B.jpeg',
      tags: [{ name: 'test' }, { name: 'test2' }],
    },
    schema: projectDetailsSchema,
    recipient: project.recipient,
  });

  await project.attest(wallet as any);

  return [project.uid];
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


attestation().then(async (uids) => {
  console.log(uids);
  await getProject(uids[0]);
  // await getCommunity(uids[0]);
  console.timeEnd('fetchSchemas');
});
