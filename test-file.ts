import { ethers } from "ethers";
import { Project, GAP, Grant, Hex, GapSchema } from "./core";

const key = require("./config/keys.json").sepolia;

const web3 = new ethers.providers.JsonRpcProvider(
  "https://goerli.optimism.io"
  // "https://eth-sepolia-public.unifra.io"
);

const wallet = new ethers.Wallet(key, web3);
const gap = GAP.createClient({
  network: "optimism-goerli",
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
    tags: p.tags.map((t) => t.name),
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
  const [projectSchema] = GapSchema.findMany(["Project", "ProjectDetails"]);

  const project = new Project({
    data: { project: true },
    schema: projectSchema,
    recipient: "0x5A4830885f12438E00D8f4d98e9Fe083e707698C",
    // uid: "0x0f290f88ef6b3838f83b49bd0c1eeb4bda31502d0aa4591470fac30abb2f0111",
  });

  await project.attest(wallet as any);

  return [project.uid];
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
