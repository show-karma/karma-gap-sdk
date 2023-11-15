import * as fs from 'fs';
import * as csv from 'fast-csv';
import { GapSchema, Hex, Project, nullRef, toUnix } from '../../core';
import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import {
  Attestation,
  GAP,
  GapIndexerClient,
  Grant,
  MemberOf,
} from '../../core/class';
import axios from 'axios';

const [, , fileName, communityUID] = process.argv;

const ChainID = {
  'optimism': 10,
  'optimism-goerli': 420,
};

const network: keyof typeof ChainID = 'optimism';
// const gapAPI = 'http://mint:3001';
const gapAPI = 'https://gapapi.karmahq.xyz';

/**
 * Secret keys
 */
const { optimism: keys, gapAccessToken } = require(__dirname +
  '/../../config/keys.json');

const privateKey = keys.privateKey;
const gelatoApiKey = keys.gelatoApiKey;
const rpcURL = keys.rpcURL;
const mainnetURL =
  'https://eth-mainnet.g.alchemy.com/v2/dRC43zHg8eyn83eR5GOiO7sfFYW8sl6t';

const grantTitle = 'GG19 - Web3 OSS';

const grantDescription =
  'We are participating in Gitcoin Round 19 (GG19).';

/**
 * web3 provider to build wallet and sign transactions
 */
const web3 = new ethers.providers.JsonRpcProvider(rpcURL);

/**
 * Wallet to sign transactions
 */
const wallet = new ethers.Wallet(privateKey, web3);

/**
 * GAP client
 */
const gap = GAP.createClient({
  network: network,
  apiClient: new GapIndexerClient(gapAPI),
  gelatoOpts: {
    // sponsorUrl: 'http://localhost:3001/attestations/sponsored-txn',
    apiKey: gelatoApiKey,
    useGasless: true,
  },
});

/**
 * Ethers client to resolve ens names
 */
const ens = new ethers.providers.JsonRpcProvider(mainnetURL);

interface CSV {
  URL: string;
  Name: string;
  Owner: string;
  Twitter: string;
  GitHub: string;
  Website: string;
  'Project Description': string;
  'Grant Update': string;
  'Grant Title': string;
  'Grant Description': string;
  externalId: string;
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
      .on('data', (d) => res.push(parserFn ? parserFn(d) : d))
      .on('error', reject)
      .on('end', () => {
        resolve(res);
      });
  });
}

const isEns = (str: string) => /^\w+\.(eth)$/.test(str);
const isHex = (str: string): str is Hex => /^0x[a-fA-F0-9]{64}$/.test(str);

function truncateWithEllipsis(input: string, limit: number = 1000): string {
  return input.length > limit ? `${input.substr(0, limit)}...` : input;
}

type DbAttestation = {
  attester: string;
  chainID: number;
  createdAt: number;
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

const toDbAttestation = (
  attestation: Attestation,
  externalId: string
): DbAttestation => ({
  attester: wallet.address,
  chainID: ChainID[network],
  createdAt: toUnix(attestation.createdAt || new Date())!,
  recipient: attestation.recipient,
  revocationTime: attestation.revocationTime?.getTime() || 0,
  revoked: !!attestation.revoked,
  schemaUID: attestation.schema.uid,
  uid: attestation.uid,
  refUID: attestation.refUID || nullRef,
  data: attestation.data,
  type: attestation.schema.name,
  externalId,
});

async function sendToIndexer(attestations: DbAttestation[]) {
  await axios.post(`${gapAPI}/attestations`, attestations, {
    headers: { 'x-access-token': gapAccessToken },
  });
}

async function checkProjectExists(projectDetails: DbAttestation) {
  try {
    const { data } = await axios.post(
      `${gapAPI}/projects/check`,
      projectDetails
    );

    return Project.from([data])[0];
  } catch {
    return undefined;
  }
}

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
        'x-access-token': gapAccessToken,
      },
    }
  );
}

async function bootstrap() {
  let uids: Hex[] = [];

  if (!fileName || !fileName.endsWith('.csv'))
    throw new Error('Please provide a valid csv file name');

  if (!communityUID || !isHex(communityUID))
    throw new Error('Please provide a valid community UID');

  const file = __dirname + `/../${fileName}`;

  const data = await parseCsv<CSV>(file);
  const filtered = data.filter((d) => isAddress(d.Owner) || isEns(d.Owner));

  let count = 0;
  for (const item of filtered) {
    console.log(count);
    count += 1;
    await new Promise((f) => setTimeout(f, 2000));

    let address = item.Owner;
    if (isEns(item.Owner)) {
      address = (await ens.resolveName(item.Owner)) || address;
    }

    const project = new Project({
      data: { project: true },
      recipient: address as Hex,
      schema: GapSchema.find('Project'),
    });

    const member = new MemberOf({
      data: { memberOf: true },
      recipient: project.recipient,
      schema: GapSchema.find('MemberOf'),
    });

    project.members.push(member);

    const grant = new Grant({
      data: { communityUID },
      recipient: project.recipient,
      schema: GapSchema.find('Grant'),
    });

    /*
    grant.updates.push(
      new GrantUpdate({
        data: {
          text: item['Grant Update'],
          title: 'Initial Update',
          type: 'grant-update',
        },
        recipient: project.recipient,
        schema: GapSchema.find('GrantDetails'),
      })
    );*/

    const defaultValues = {
      recipient: project.recipient,
      attester: project.recipient,
      chainID: ChainID[network],
      createdAt: Math.floor(Date.now() / 1000),
      revocationTime: 0,
      revoked: false,
    };

    const projectDetails: DbAttestation = {
      data: {
        description: truncateWithEllipsis(item['Project Description']),
        imageURL: '',
        title: item.Name,
        links: [
          {
            type: 'website',
            url: item.Website,
          },
          {
            type: 'twitter',
            url: item.Twitter,
          },
          {
            type: 'github',
            url: item.GitHub,
          },
        ],
        slug: await gap.generateSlug(item.Name, false),
      },
      type: 'ProjectDetails',
      refUID: project.uid,
      schemaUID: GapSchema.find('ProjectDetails').uid,
      uid: nullRef,
      ...defaultValues,
    };

    const grantDetails: DbAttestation = {
      data: {
        proposalURL: item.URL,
        title: grantTitle,
        description: grantDescription,
        payoutAddress: project.recipient,
      },
      type: 'GrantDetails',
      schemaUID: GapSchema.find('GrantDetails').uid,
      refUID: nullRef,
      uid: nullRef,
      ...defaultValues,
    };

    project.grants.push(grant);

    // avoid duplicate attestations
    const hasProject = await checkProjectExists(projectDetails);
    if (hasProject) {
      const concurrentGrant = hasProject.grants.find(
        (g) => g.details?.title === item['Name'] && g.externalId
      );

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
    console.log('Attesting project ');
    console.log(item.Name);
    if (projectDetails?.data)
      projectDetails.data.slug = await gap.generateSlug(item.Name, true);

    await project.attest(wallet as any);

    projectDetails.refUID = project.uid;
    projectDetails.uid = `ref_${project.uid}`;

    if (project.grants[0]?.uid) {
      grantDetails.refUID = project.grants[0]?.uid || nullRef;
      grantDetails.uid = `ref_${grantDetails.refUID}`;
    }

    await sendToIndexer([
      projectDetails,
      toDbAttestation(grant, item.externalId),
      grantDetails,
    ]);

    uids.push(project.uid);
  }

  console.log('Attesting...');
  console.log('Attested projects: ', uids.length);
  console.log(uids);

  console.log('Found concurrent grants for external ids: ');
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
