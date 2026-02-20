import axios from "axios";
import { ethers, isAddress } from "ethers";
import * as csv from "fast-csv";
import * as fs from "fs";
import {
  GAP,
  GAPRpcConfig,
  Grant,
  Hex,
  MemberOf,
  Project,
  TNetwork,
  nullRef,
} from "../../core";
import { GrantUpdate, IGrantUpdate } from "../../core/class";
import {
  GrantDetails,
  ProjectDetails,
} from "../../core/class/types/attestations";
import {
  API_ENDPOINTS,
  CHAIN_IDS,
  DEFAULT_CONFIG,
  GRANT_UPDATE_TYPES,
  LINK_TYPES,
} from "../config";
import { Link } from "../types";

const [, , fileName, communityUID] = process.argv;

interface Keys {
  privateKey: string;
  rpcURL: string;
  gapAPI: string;
}

interface Config {
  [key: string]: Keys | string;
  optimism: Keys;
  "optimism-sepolia": Keys;
  sepolia: Keys;
  arbitrum: Keys;
  "base-sepolia": Keys;
  celo: Keys;
  sei: Keys;
  "sei-testnet": Keys;
  lisk: Keys;
  scroll: Keys;
  gapAccessToken: string;
}

interface NetworkConfig {
  networkName: TNetwork;
  rpcURL: string;
  gapAPI: string;
  privateKey: string;
  gapAccessToken: string;
}

function loadConfig(): NetworkConfig {
  const networkName = DEFAULT_CONFIG.DEFAULT_NETWORK as TNetwork;
  const { [networkName]: keys, gapAccessToken } = require(__dirname +
    "/../keys.json") as Config;

  return {
    networkName,
    rpcURL: keys.rpcURL,
    gapAPI:
      DEFAULT_CONFIG.DEFAULT_NETWORK === "optimism-sepolia"
        ? "https://gapstagapi.karmahq.xyz"
        : "https://gapapi.karmahq.xyz",
    privateKey: keys.privateKey,
    gapAccessToken: gapAccessToken,
  };
}

const config = loadConfig();

const web3 = new ethers.JsonRpcProvider(config.rpcURL);
const wallet = new ethers.Wallet(config.privateKey, web3);

// Configure RPC URLs for GAP
const rpcUrls: GAPRpcConfig = {
  [CHAIN_IDS[config.networkName]]: config.rpcURL,
};

const gap = GAP.getInstance({ network: config.networkName, rpcUrls });

interface CSV {
  Project: string;
  ProposalURL: string;
  Owner: string;
  Twitter: string;
  Github: string;
  Website: string;
  FundingMapID: string;
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
  Problem: string;
  Solution: string;
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

const isEns = (str: string) => DEFAULT_CONFIG.ENS_REGEX.test(str);
const isHex = (str: string): str is Hex => DEFAULT_CONFIG.HEX_REGEX.test(str);

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

async function checkProjectExists(projectDetails: DbAttestation) {
  try {
    const { data } = await axios.post(
      `${config.gapAPI}${API_ENDPOINTS.PROJECTS.CHECK}`,
      projectDetails
    );
    return data;
  } catch (e) {
    return undefined;
  }
}

async function updateExternalIds(
  projectUID: string,
  communityUID: string,
  externalId: string
) {
  await axios.put(
    `${config.gapAPI}${API_ENDPOINTS.GRANTS.EXTERNAL_ID.BULK_UPDATE}`,
    {
      projectUID,
      communityUID,
      externalId,
    },
    {
      headers: {
        "x-access-token": config.gapAccessToken,
      },
    }
  );
}

async function validateInputs() {
  if (!fileName || !fileName.endsWith(".csv")) {
    throw new Error("Please provide a valid csv file name");
  }

  if (!communityUID || !isHex(communityUID)) {
    throw new Error("Please provide a valid community UID");
  }

  if (!fs.existsSync(__dirname + `/../${fileName}`)) {
    throw new Error(`File ${fileName} does not exist`);
  }
}

async function bootstrap() {
  try {
    await validateInputs();

    let missedGrants: string[] = [];
    let uids: Hex[] = [];

    const file = __dirname + `/../${fileName}`;
    const data = await parseCsv<CSV>(file);
    const filtered = data.filter((d) => isAddress(d.Owner) || isEns(d.Owner));

    let count = 0;

    for (const item of data) {
      try {
        console.log(`${count} - ${item.Project.trim()}`);
        count += 1;
        await new Promise((f) =>
          setTimeout(f, DEFAULT_CONFIG.CSV_PROCESSING.DELAY_BETWEEN_ITEMS_MS)
        );

        let address =
          item?.Owner?.trim() || DEFAULT_CONFIG.DEFAULT_OWNER_ADDRESS;

        const slug = await gap.generateSlug(item.Project.trim());
        const project = new Project({
          data: { project: true },
          recipient: address as Hex,
          schema: gap.findSchema("Project"),
          uid: nullRef,
        });

        const links: Link[] = [
          {
            type: LINK_TYPES.WEBSITE,
            url: item.Website,
          },
          {
            type: LINK_TYPES.TWITTER,
            url: item.Twitter,
          },
          {
            type: LINK_TYPES.GITHUB,
            url: item.Github,
          },
        ];

        project.details = new ProjectDetails({
          data: {
            description: item["Project Description"],
            imageURL: "",
            title: item.Project.trim(),
            links,
            slug,
            problem: item.Problem,
            solution: item.Solution,
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

        project.members.push(member);

        const grant = new Grant({
          data: { communityUID: communityUID as Hex },
          recipient: project.recipient,
          schema: gap.findSchema("Grant"),
        });

        grant.details = new GrantDetails({
          data: {
            proposalURL: item.ProposalURL,
            title: item.GrantTitle,
            description: item.GrantDescription,
            ...(item.Amount && { amount: item.Amount }),
            payoutAddress: project.recipient,
            programId: item.FundingMapID,
          },
          recipient: project.recipient,
          schema: gap.findSchema("GrantDetails"),
        });

        grant.updates.push(
          new GrantUpdate({
            data: {
              text: "Updates can be found here: " + item.ProposalURL,
              type: GRANT_UPDATE_TYPES.GRANT_UPDATE,
              title: "",
            } as IGrantUpdate,
            recipient: project.recipient,
            schema: gap.findSchema("GrantDetails"),
          })
        );

        project.grants.push(grant);

        const defaultValues = {
          recipient: project.recipient,
          attester: project.recipient,
          chainID: CHAIN_IDS[config.networkName],
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
          refUID: project.uid,
          schemaUID: gap.findSchema("ProjectDetails").uid,
          uid: nullRef,
          ...defaultValues,
        };

        // avoid duplicate projects
        const hasProject = await checkProjectExists(projectDetails);

        if (hasProject) {
          const concurrentGrant = hasProject.grants.find(
            (g) => g.details?.data?.title === item.GrantTitle
          );

          if (!concurrentGrant) {
            console.log(`Didn't find grant for project ${item.Project}`);
            Object.assign(grant, { refUID: hasProject.uid });
            missedGrants.push(item.Project);
            await grant.attest(wallet as any, hasProject.chainID);
          } else {
            console.log(`Found grant for project ${item.Project}`);
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
            await updateExternalIds(
              hasProject.uid,
              communityUID,
              item.externalId
            );
          }
          continue;
        }

        try {
          console.log(project.details.data);
          console.log(project.grants?.[0]?.details?.data);
          await project.attest(wallet as any);
          uids.push(project.uid);
        } catch (e) {
          console.log(`Failed to save for ${item.Project}`);
        }
      } catch (error) {
        console.error(`Error processing project ${item.Project}:`, error);
        missedGrants.push(item.Project);
        continue;
      }
    }

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
      `\x1b[36mConcurrent grants saved to ${concurrentGrantFile}\x1b[0m`
    );

    console.log("Missed grants:", missedGrants);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

bootstrap();
