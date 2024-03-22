import { ethers } from 'ethers';
import {
  Project,
  GAP,
  Grant,
  Hex,
  GapSchema,
  ProjectDetails,
  CommunityDetails,
  MilestoneCompleted,
  GrantDetails,
  nullRef,
  GrantUpdate,
  ProjectImpact,
} from './core';
import {
  Community,
  GapIndexerClient,
  IpfsStorage,
  Milestone,
  RemoteStorage,
} from './core/class';
import axios from 'axios';


const walletAddress = '0x5A4830885f12438E00D8f4d98e9Fe083e707698C';
const web3 = new ethers.AlchemyProvider('optimism-sepolia', '9FEqTNKmgO7X7ll92ALJrEih7Jjhldf-');
const wallet = new ethers.Wallet('98f6ff7002240e302cee6665286079adb4dba0d49a8f927c1b9f5d622bae9939', web3 as any);

const gap = new GAP({
  network: 'optimism-sepolia',
  apiClient: new GapIndexerClient('https://gapstagapi.karmahq.xyz'),
  remoteStorage: new IpfsStorage(
    {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVkMjAzYTRFODc3ZjFlQTk2MzkzY2M5YjhDNUU4NUUxM2U5OWI5NzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwMDUxNTIzOTg5MSwibmFtZSI6IkdBUF9URVNUIn0.QwVmWPOXeDKCtWGFaLxGdllv-te1pKc4Jrj7rYlMdFk',
    },
    {
      url: 'https://gapstagapi.karmahq.xyz/ipfs',
      responseParser: (response: any) => response.cid,
    }
  ),
});


async function getProject() {
  const project = await gap.fetch.projectBySlug("0xe9f6e69e04ad3912ba51596c888b1594225cf8796d8b08c0128aa9ce3af49369");
}


getProject().then((project) => {});

async function attestation() {
  const projectImpact = new ProjectImpact({
    data: {
      impact: 'This is my impact #1',
      work: 'I did this work #1',
      proof: 'www.karmahq.xyz',
    },
    schema: gap.findSchema('ProjectImpact'),
    refUID: '0x1b6461f09372e6aeb1c1116b38e9b9f7fb54ef9f9c30d01b7c383d26906c6b92',
    recipient: walletAddress
  });

  console.log(projectImpact)
  const response = await projectImpact.attest(wallet as any, 11155420)
}

// attestation().then((uids) => {
//   console.log('Finish Attest');
// });


// (async () => {
//   const resolver = await GAP.getCommunityResolver((web3 as any), 10);
//   const response = await resolver.isAdmin(
//     '0x80fdb7152814c47d100e25920d68a3754d4f5cd6319f0cd1b4da965ac9219b81',
//     '0x23B7A53ecfd93803C63b97316D7362eae59C55B6');
//   console.log(response)
// })()


// (async () => {
//   const web3 = new ethers.AlchemyProvider('optimism', 'fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl');
//   const localWallet = new ethers.Wallet('98f6ff7002240e302cee6665286079adb4dba0d49a8f927c1b9f5d622bae9939', web3 as any);

//   const completed = new MilestoneCompleted({
//     data: {
//       type: 'verified',
//       reason: 'a',
//     },
//     schema: gap.findSchema('MilestoneCompleted'),
//     refUID: '0x5da26f12eb078b150a225df91088f28d366c7210e9ef7e1b0448ea5f2dd92b1b',
//     recipient: "0x23B7A53ecfd93803C63b97316D7362eae59C55B6"
//   });

//   await completed.attest(localWallet as any);
//   console.log('Finish Attest: ', completed);
// })();


