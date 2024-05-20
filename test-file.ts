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
  ProjectEndorsement,
} from './core';
import {
  Community,
  GapIndexerClient,
  IpfsStorage,
  Milestone,
  RemoteStorage,
} from './core/class';
import axios from 'axios';
import CommunityResolverABI from './core/abi/CommunityResolverABI.json';
import { GapIndexerApi } from './core/class/karma-indexer/api/GapIndexerApi';

// const walletAddress = '0x5A4830885f12438E00D8f4d98e9Fe083e707698C';
// const web3 = new ethers.AlchemyProvider(
//   'optimism-sepolia',
//   '9FEqTNKmgO7X7ll92ALJrEih7Jjhldf-'
// );
// const wallet = new ethers.Wallet(
//   '',
//   web3 as any
// );

// const gap = new GAP({
//   network: 'optimism-sepolia',
//   apiClient: new GapIndexerClient('https://gapstagapi.karmahq.xyz'),
//   remoteStorage: new IpfsStorage(
//     {
//       token:
//         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVkMjAzYTRFODc3ZjFlQTk2MzkzY2M5YjhDNUU4NUUxM2U5OWI5NzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwMDUxNTIzOTg5MSwibmFtZSI6IkdBUF9URVNUIn0.QwVmWPOXeDKCtWGFaLxGdllv-te1pKc4Jrj7rYlMdFk',
//     },
//     {
//       url: 'https://gapstagapi.karmahq.xyz/ipfs',
//       responseParser: (response: any) => response.cid,
//     }
//   ),
// });

// async function attestation() {
//   const grant = new Grant({
//     data: {
//       communityUID:
//         '0xc85c9f504e60550bc45e87ab71986c36f046e8f8aa8085bbe07d37825bcbb10a',
//     },
//     refUID:
//       '0xc3594f22568f292c9ac55e4181fd79e07e9a42d3c630906d734aecfc0fe9c19b',
//     schema: gap.findSchema('Grant'),
//     recipient: walletAddress,
//     uid: nullRef,
//   });
//   grant.details = new GrantDetails({
//     data: {
//       amount: '',
//       description: 'Description',
//       proposalURL: 'link',
//       title: 'Title test-fine #01',
//       assetAndChainId: ['0x0', 1],
//       payoutAddress: walletAddress,
//       // cycle: data.cycle,
//       // season: data.season,
//       questions: [],
//       startDate: new Date().getTime() / 1000,
//     },
//     refUID: grant.uid,
//     schema: gap.findSchema('GrantDetails'),
//     recipient: grant.recipient,
//     uid: nullRef,
//   });
//   // eslint-disable-next-line no-param-reassign
//   // grant.updates = data.grantUpdate
//   //   ? [
//   //       new GrantUpdate({
//   //         data: {
//   //           text: data.grantUpdate || "",
//   //           title: "",
//   //         },
//   //         schema: gap.findSchema("Milestone"),
//   //         recipient: grant.recipient,
//   //       }),
//   //     ]
//   //   : [];

//   // eslint-disable-next-line no-param-reassign
//   const milestones = [
//     {
//       title: 'Milestone Title #01',
//       description: 'Milestone Description',
//       endsAt: new Date().getTime() / 1000,
//       completedText: 'Completed Text',
//     },
//   ];
//   grant.milestones = milestones.map((milestone) => {
//     const created = new Milestone({
//       data: {
//         title: milestone.title,
//         description: milestone.description,
//         endsAt: milestone.endsAt,
//       },
//       refUID: grant.uid,
//       schema: gap.findSchema('Milestone'),
//       recipient: grant.recipient,
//       uid: nullRef,
//     });
//     if (milestone.completedText) {
//       created.completed = new MilestoneCompleted({
//         data: {
//           reason: milestone.completedText,
//           type: 'completed',
//         },
//         refUID: created.uid,
//         schema: gap.findSchema('MilestoneCompleted'),
//         recipient: grant.recipient,
//       });
//     }
//     return created;
//   });

//   const response = await grant.attest(wallet as any, 11155420);
//   console.log(response);
// }

// // attestation().then((uids) => {
// //   console.log('Finish Attest');
// // });

// (async () => {
//   try {
//     const project = await gap.fetch.projectBySlug('project-zomboid');
//     const response = await project.attestEndorsement(wallet, {
//       comment: 'This is my first endorsement with comment!'
//     } as ProjectEndorsement)
//     console.log(project);
//   } catch (err) {
//     console.log(err);
//   }
// })();

// // (async () => {
// //   const resolver = new ethers.Contract('0xa5B7bbFD545A1a816aa8cBE28a1F0F2Cca58363d', CommunityResolverABI, wallet as any);
// //   const response = await resolver.isAdmin(
// //     '0x929de14333fe173c99cea73fe1356b0cd30041ef7b1752253105c60653fa1815',
// //     '0x57855A663D824BFfe6eb6f9c271E42a42BF3587e');
// //   console.log(response)
// // })()

// // (async () => {
// //   const web3 = new ethers.AlchemyProvider('optimism', 'fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl');
// //   const localWallet = new ethers.Wallet('98f6ff7002240e302cee6665286079adb4dba0d49a8f927c1b9f5d622bae9939', web3 as any);

// //   const completed = new MilestoneCompleted({
// //     data: {
// //       type: 'verified',
// //       reason: 'a',
// //     },
// //     schema: gap.findSchema('MilestoneCompleted'),
// //     refUID: '0x5da26f12eb078b150a225df91088f28d366c7210e9ef7e1b0448ea5f2dd92b1b',
// //     recipient: "0x23B7A53ecfd93803C63b97316D7362eae59C55B6"
// //   });

// //   await completed.attest(localWallet as any);
// //   console.log('Finish Attest: ', completed);
// // })();


(async() =>{
  (async () => {
    const gap = new GapIndexerApi('https://gapstagapi.karmahq.xyz');
    console.log('here')
    const response = await gap.communityAdmins("0x929de14333fe173c99cea73fe1356b0cd30041ef7b1752253105c60653fa1815");
    console.log(response);
  })()
} )()
