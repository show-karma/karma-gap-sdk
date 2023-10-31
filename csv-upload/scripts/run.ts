import * as fs from 'fs';
import * as csv from 'fast-csv';
import {
  GapSchema,
  GrantDetails,
  GrantUpdate,
  Hex,
  MultiAttestPayload,
  Project,
  ProjectDetails,
  RawMultiAttestPayload,
} from '../../core';
import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { GAP, GapIndexerClient, Grant, MemberOf } from '../../core/class';
import { GapContract } from '../../core/class/contract/GapContract';

const [, , fileName, communityUID] = process.argv;

const network = "optimism";
const gapAPI = "https://gapapi.karmahq.xyz";

/**
 * Secret keys
 */
const { optimism: keys } = require(__dirname +
  '/../../config/keys.json');

const privateKey = keys.privateKey;
const gelatoApiKey = keys.gelatoApiKey;
const rpcURL = keys.rpcURL;
const mainnetURL = ""

const grantTitle = "GG18 - Web3 OSS"

const grantDescription = "We participated in Gitcoin Round 18 (GG18). A heartfelt thanks to all our donors for their invaluable support."

/**
 * web3 provider to build wallet and sign transactions
 */
const web3 = new ethers.providers.JsonRpcProvider(
  rpcURL
);

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
  Github: string;
  Website: string;
  'Project Description': string;
  'Grant Update': string;
}

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

function truncateWithEllipsis(input: string, limit: number = 1500): string {
    return input.length > limit ? `${input.substr(0, limit)}...` : input;
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

  for (const item of filtered) {

    await new Promise(f => setTimeout(f, 4000));
    
    let address = item.Owner;
    if (isEns(item.Owner)) {
      address = (await ens.resolveName(item.Owner)) || address;
    }

    const project = new Project({
      data: { project: true },
      recipient: address as Hex,
      schema: GapSchema.find('Project'),
    });

    project.details = new ProjectDetails({
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
            url: item.Github,
          },
        ],
        slug: await gap.generateSlug(item.Name),
      },
      recipient: project.recipient,
      schema: GapSchema.find('ProjectDetails'),
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

    grant.details = new GrantDetails({
      data: {
        proposalURL: item.URL,
        title: grantTitle,
        description: grantDescription,
        payoutAddress: project.recipient,
      },
      recipient: project.recipient,
      schema: GapSchema.find('GrantDetails'),
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


    project.grants.push(grant);
    await project.attest(wallet as any);
    uids.push(project.uid);
  }

  console.log('Attesting...');
  console.log('Attested projects: ', uids.length);
  console.log(uids);
}

bootstrap();
