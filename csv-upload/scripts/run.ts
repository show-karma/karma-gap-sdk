import * as fs from "fs";
import * as csv from "fast-csv";
import { GapSchema, Hex, Project, nullRef, toUnix } from "../../core";
import { isAddress, ethers } from "ethers";
import {
  GAP,
  Grant,
  MemberOf,
} from "../../core";
import {
  ProjectDetails,
  GrantDetails,
} from "../../core/class/types/attestations";

import axios from "axios";
import { GapIndexerClient, GrantUpdate, IpfsStorage } from "../../core/class";

const [, , fileName, communityUID] = process.argv;

const ChainID = {
  optimism: 10,
  // "optimism-goerli": 420,
  sepolia: 11155111,
  "optimism-sepolia": 11155420,
  arbitrum: 42161,
};

const networkName = "optimism-sepolia";

//////////////////////////////////////////////////////////////////////////////////////////////////
const network: keyof typeof ChainID = networkName;

/**
 * Secret keys
 */
const { arbitrum: keys, gapAccessToken } = require(__dirname +
  "/../../config/keys.json");

//////////////////////////////////////////////////////////////////////////////////////////////////
const privateKey = '98f6ff7002240e302cee6665286079adb4dba0d49a8f927c1b9f5d622bae9939';
// const gelatoApiKey = keys.gelatoApiKey;
const rpcURL = 'https://sepolia.optimism.io';
const gapAPI = 'https://gapstagapi.karmahq.xyz';
const ipfsKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVkMjAzYTRFODc3ZjFlQTk2MzkzY2M5YjhDNUU4NUUxM2U5OWI5NzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwMDUxNTIzOTg5MSwibmFtZSI6IkdBUF9URVNUIn0.QwVmWPOXeDKCtWGFaLxGdllv-te1pKc4Jrj7rYlMdFk`;
const ipfsURL = `${gapAPI}/ipfs`;
const mainnetURL =
  "https://eth-mainnet.g.alchemy.com/v2/dRC43zHg8eyn83eR5GOiO7sfFYW8sl6t";

/**
 * web3 provider to build wallet and sign transactions
 */
const web3 = new ethers.JsonRpcProvider(rpcURL);

/**
 * Wallet to sign transactions
 */
const wallet = new ethers.Wallet(privateKey, web3);

/**
 * GAP client
 */

const ipfsClient = new IpfsStorage(
  {
    token: ipfsKey,
  },
  {
    url: ipfsURL,
    responseParser: (res) => res.cid,
  }
);

const gap = new GAP({
  globalSchemas: false,
  network: networkName,
  apiClient: new GapIndexerClient(gapAPI),
  remoteStorage: ipfsClient,
});

/**
 * Ethers client to resolve ens names
 */
const ens = new ethers.JsonRpcProvider(mainnetURL);

interface CSV {
  ProposalURL: string;
  Project: string;
  Owner: string;
  Twitter: string;
  Github: string;
  Website: string;
  GrantTitle: string;
  "Project Description": string;
  "Grant Update": string;
  "Grant Title": string;
  GrantDescription: string;
  externalId: string;
  Amount: string;
  "Grant Link": string;
  "Grant Objective": string;
  "Grant Size Justification": string;
  Updates: string;
}

const duplicatedGrants: {
  project: {
    uid: string;
    name?: string;
  };
  grant: {
    uid: string;
    title?: string;
  };
  currentExtId: string;
  candidateExtId: string;
}[] = [];

export function parseCsv<T>(
  path: string,
  parserFn?: (row: unknown) => Promise<void> | void
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const res: T[] = [];
    fs.createReadStream(path)
      .pipe(csv.parse({ headers: true }))
      .transform((row: unknown) => {
        return row;
      })
      .on("data", (d) => res.push(parserFn ? parserFn(d) : d))
      .on("error", reject)
      .on("end", () => {
        resolve(res);
      });
  });
}

const isEns = (str: string) => /^\w+\.(eth)$/.test(str);
const isHex = (str: string): str is Hex => /^0x[a-fA-F0-9]{64}$/.test(str);

function truncateWithEllipsis(input: string, limit: number = 100): string {
  return input.length > limit ? `${input.substr(0, limit)}...` : input;
}

type DbAttestation = {
  attester: string;
  chainID: number;
  createdAt: Date;
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  schemaUID: string;
  uid: string;
  refUID: string;
  data?: any;
  type: string;
  externalId?: string;
};

async function sendToIndexer(attestations: DbAttestation[]) {
  await axios.post(`${gapAPI}/attestations`, attestations, {
    headers: { "x-access-token": gapAccessToken },
  });
}

async function checkProjectExists(projectDetails: DbAttestation) {
  try {
    const { data } = await axios.post(
      `${gapAPI}/projects/check`,
      projectDetails
    );

    return data;
  } catch {
    return undefined;
  }
}

/*
async function getProject(title: string) {
  try {
    const { data } = await axios.post(
      `${gapAPI}/projects/check`,
      projectDetails
    );

    return data;
  } catch {
    return undefined;
  }
}
*/

async function updateExternalIds(
  projectUID: string,
  communityUID: string,
  externalId: string
) {
  await axios.put(
    `${gapAPI}/grants/external-id/bulk-update`,
    {
      projectUID,
      communityUID,
      externalId,
    },
    {
      headers: {
        "x-access-token": gapAccessToken,
      },
    }
  );
}

async function bootstrap() {
  let uids: Hex[] = [];

  if (!fileName || !fileName.endsWith(".csv"))
    throw new Error("Please provide a valid csv file name");

  if (!communityUID || !isHex(communityUID))
    throw new Error("Please provide a valid community UID");

  const file = __dirname + `/../${fileName}`;

  const data = await parseCsv<CSV>(file);
  const filtered = data.filter((d) => isAddress(d.Owner) || isEns(d.Owner));

  let count = 0;

  for (const item of data) {
    console.log(count);
    count += 1;
    await new Promise((f) => setTimeout(f, 2000));

    //let address = item.Owner;
    let address = "0x23B7A53ecfd93803C63b97316D7362eae59C55B6";
    //if (isEns(item.Owner)) {
    //  address = (await ens.resolveName(item.Owner)) || address;
    // }

    const slug = await gap.generateSlug(item.Project.trim());
<<<<<<< Updated upstream
=======
    const project = new Project({
      data: { project: true },
      recipient: address as Hex,
      schema: gap.findSchema("Project"),
      uid: nullRef,
    });

    project.details = new ProjectDetails({
      data: {
        description: item["Project Description"],
        imageURL: "",
        title: item.Project.trim(),
        links: [
          {
            type: "website",
            url: item.Website,
          },
          {
            type: "twitter",
            url: item.Twitter,
          },
          {
            type: "github",
            url: item.Github,
          },
        ],
        slug: slug,
      },
      refUID: project.uid,
      recipient: project.recipient,
      schema: gap.findSchema("ProjectDetails"),
      uid: nullRef,
    });

    const member = new MemberOf({
      data: { memberOf: true },
      recipient: project.recipient,
      schema: gap.findSchema("MemberOf"),
      refUID: project.uid,
      uid: nullRef,
    });

    //project.members.push(member);

    let grant = new Grant({
      data: { communityUID },
      recipient: project.recipient,
      schema: gap.findSchema("Grant"),
    });

    grant.details = new GrantDetails({
      data: {
        proposalURL: item.ProposalURL,
        title: item.GrantTitle,
        description: item["Project Description"],
        amount: item.Amount,
        payoutAddress: project.recipient,
      },
      recipient: project.recipient,
      schema: gap.findSchema("GrantDetails"),
    });

    grant.updates.push(
      new GrantUpdate({
        data: {
          text: "Updates can be found here: " + item.ProposalURL,
          type: "grant-update",
          title: "",
        },
        recipient: project.recipient,
        schema: gap.findSchema("GrantDetails"),
      })
    );

    project.grants.push(grant);
>>>>>>> Stashed changes

    const defaultValues = {
      recipient: address as Hex,
      attester: address as Hex,
      chainID: ChainID[network],
      createdAt: new Date(),
      revocationTime: 0,
      revoked: false,
    };

    const projectDetails: DbAttestation = {
      data: {
        description: item["Project Description"],
        imageURL: "",
        title: item.Project.trim(),
        slug: slug,
      },
      type: "ProjectDetails",
      refUID: nullRef,
      schemaUID: gap.findSchema("ProjectDetails").uid,
      uid: nullRef,
      ...defaultValues,
    };

      // avoid duplicate attestations
    const hasProject = await checkProjectExists(projectDetails);

    let project;

    if(hasProject) {
      project = await gap.fetch.projectById(hasProject.uid);
    }

    if(!project){
      project = new Project({
        data: { project: true },
        recipient: address as Hex,
        schema: gap.findSchema("Project"),
        uid: nullRef,
      });
  
      project.details = new ProjectDetails({
        data: {
          description: item["Project Description"],
          imageURL: "",
          title: item.Project.trim(),
          links: [
            {
              type: "website",
              url: item.Website,
            },
            {
              type: "twitter",
              url: item.Twitter,
            },
            {
              type: "github",
              url: item.Github,
            },
          ],
          slug: slug,
        },
        refUID: project.uid,
        recipient: project.recipient,
        schema: gap.findSchema("ProjectDetails"),
        uid: nullRef,
      });
  
      const member = new MemberOf({
        data: { memberOf: true },
        recipient: project.recipient,
        schema: gap.findSchema("MemberOf"),
        refUID: project.uid,
        uid: nullRef,
      });
  
      //project.members.push(member);
  
    }

    const grant = new Grant({
      data: { communityUID },
      recipient: project.recipient,
      schema: gap.findSchema("Grant"),
      refUID: project.uid,
    });

    grant.details = new GrantDetails({
      data: {
        proposalURL: item.ProposalURL,
        title: item.GrantTitle,
        description: item["Project Description"],
        amount: item.Amount,
        payoutAddress: project.recipient,
      },
      recipient: project.recipient,
      schema: gap.findSchema("GrantDetails"),
      refUID: grant.uid,
    });

    grant.updates.push(
      new GrantUpdate({
        data: {
          text: "Updates can be found here: " + item.ProposalURL,
          type: "grant-update",
          title: "",
        },
        recipient: project.recipient,
        schema: gap.findSchema("GrantDetails"),
        refUID: grant.uid,
      })
    );

    const concurrentGrant = project.grants.find(
      (g) => g.details?.data?.title === item.GrantTitle
    );

    // avoiding duplicated grants;
    if(!concurrentGrant){
      project.grants.push(grant);
    }

    if (hasProject) {
      if (!concurrentGrant) {
        console.log(`Didn't find grant for project ${item.Project}`);
<<<<<<< Updated upstream
        await grant.attest(wallet as any, ChainID[network]);
        //   /*grantDetails.refUID = grant.uid;
        //   grantDetails.uid = `ref_${grant.uid}`;
        //   await sendToIndexer([
        //     toDbAttestation(grant, item.externalId),
        //     grantDetails,
        //   ]);
        //  */
=======
        grant.refUID = hasProject.uid;
        await grant.attest(wallet as any, project.chainID);
        /*grantDetails.refUID = grant.uid;
        grantDetails.uid = `ref_${grant.uid}`;
        await sendToIndexer([
          toDbAttestation(grant, item.externalId),
          grantDetails,
        ]);
       */
>>>>>>> Stashed changes
      }

      if (
        item.externalId &&
        concurrentGrant &&
        concurrentGrant.externalId &&
        concurrentGrant.externalId !== item.externalId
      ) {
        duplicatedGrants.push({
          project: {
            uid: hasProject.uid,
            name: hasProject.details?.title,
          },
          grant: {
            uid: concurrentGrant.uid,
            title: concurrentGrant.details?.title,
          },
          currentExtId: concurrentGrant.externalId,
          candidateExtId: item.externalId,
        });
      } else if (item.externalId) {
        await updateExternalIds(hasProject.uid, communityUID, item.externalId);
      }
      continue;
    }

    console.log("Attesting project ");
    console.log(item.Project);
    await project.attest(wallet as any);
    uids.push(project.uid);
  }

  console.log("Attesting...");
  console.log("Attested projects: ", uids.length);
  console.log(uids);

  console.log("Found concurrent grants for external ids: ");
  console.log(duplicatedGrants);
  const concurrentGrantFile = `${__dirname}/${Date.now()}-concurrent-grants.json`;
  fs.writeFileSync(
    concurrentGrantFile,
    JSON.stringify(duplicatedGrants, null, 2)
  );
  console.log(
    `\xb1[36mConcurrent grants saved to ${concurrentGrantFile}\x1b[0m`
  );
}

bootstrap();
