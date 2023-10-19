# Karma GAP SDK

## Summary

1. [What is GAP SDK?](#1-what-is-gap-sdk)
2. [Architecture](#2-architecture)
3. [Getting started](#3-getting-started)
4. [Getting attestations](#4-getting-attestations)
5. [Attesting data in a Frontend](#5-attesting-data-in-a-frontend)
6. [Attesting data in a Backend](#6-attesting-data-in-a-backend)
7. [Gasless transactions with Gelato](#7-gasless-transactions-with-gelato)
8. [Speed up requests with a Custom API](#8-custom-api)

## 1. What is GAP SDK?

The GAP SDK is a tool that provides easiness to work with the [accountability protocol](https://gap.karmahq.xyz), and it's core is developed
to support customisation\* and flexibility.

Through this tool you will be able to:

    - Get and display Communities, Projects, Members, Grants, Milestones and all of their dependencies;
    - Transact attestations for all above;
    - Transact revocations for all above;
    - Use gasless transactions with [Gelato Relay](https://relay.gelato.network);
    - Use a custom API to speed up requests since it follows the defined parameters.

> \* We're currently improving the ability to customise this api through tools that facilitates the change of parameters, and this feature may seem confusing at the moment if you try to modify certain parameters such as default schemas and contracts.

## 2. Architecture

This SDK is module-based and follows certain parameters to keep organization and ease to maintain. On its core, the SDK is divided into x modules:

1. **GAP** Facade: this object is responsible of bringing the user the centralization of resources for this SDK, providing all the tools and methods to bring attestations from the network to a concrete object that can be used to display, attest, modify, and revoke. GAP Facade provides the `fetcher` module and stores all the settings for the instance.

2. **Attestations**: attestation is a generic module that can fit any kind of attestation available at [EAS](https://attest.sh) and can be inherited to specific attestation types such as a Project, for example. This generic object can also perform attestations and revokations through `Schema` module.

3. **Schemas**: Schema is an **abstract module** that get the responsibility of creating a relationship to the EAS infrastructure. This is a class that will contain all the parameters, methods and interactions that are necessary to communicate with the blockchain.

4. **Entities**: An entity is a specific attestation `type` that was modified to fit specific needs, such as data processing before attesting or methods overriding. An entity always extends `Attestation` module and inherits all of its features.

5. **Contract**: To provide all the needs of this SDK, we use a custom middle contract adding an abstraction to the EAS original contracts. This is essential for a good experience, gas cost reduction, and monitoring. Karma's GAP SDK uses a special contract to perform this action. For better information, please check [Gap Contracts](https://github.com/show-karma/gap-contracts) repository.

6. **Fetcher**: This is an **abstract module** is responsible to interact with EAS or a custom API to get attesations and transform into an instance of `Attestation`. The `Fetcher` module is essential if a custom api is wanted.

Let's see how all of this works with a Getting Projects example:

![img](docs/images/dfd-get-projects.png)

Here you can already see the advantages of using a Custom API to get data from the network and build your own indexer instead of using EAS's available GraphQL API. We'll dive into it in [Chapter 8](#8-custom-api)

> \* Note that GAP currently does not fully support multichain, and if more than one instance is created, it can lead to unexpected errors when using the fetcher. This feature is under development.

### Attestations

Attestations are split into several types of entities, to create a relationship between them and allow the users to modify their attestation details witout losing the dependents reference to the main attestation. So because of it, community, project, grant, and members needs two attestations:
the first defining an entity, and the second one defining its details, and because of that point, all these entities will include a `details` property containing all the data inserted into that attestation, such as:

```ts
import { Project } from 'karma-gap-sdk';

export function printProjectDetails(project: Project) {
  console.log({
    title: project.details?.title,
    imageURL: project.details?.imageURL,
    description: project.details?.description,
  });
}
```

This example can be followed for all the entities in the following diagram that is related to a detail, and each one has its own interface and details parameters.

> While effectively using this SDK, you can notice differences between the listed data in the diagram and the actual entity. This happens because we need to organize our classes to facilitate the usage of some parameters, such as `Grant.communities` that is not included in the diagram. The diagram also includes only attestation data, and some data is added during the runtime and not in the actual on-chain attestation.

![architecture](./docs/images/attestation-architecture.png)

## 3. Getting started

After setting up your project, install GAP SDK with `yarn` or `npm`:

`$ yarn add karma-gap-sdk`

`$ npm i karma-gap-sdk`

After installing, you can instantiante GAP:

```ts
// gap.client.ts;
import { GAP } from 'karma-gap-sdk';

const gap = GAP.createClient({
  network: 'optimism-goerli', // sepolia, optimism,
  // apiClient: custom api client, see it on Chap. 8;
  // gelatoOpts: for gasless transactions, see it on Chap. 7;
});

export default gap;
```

The `GAP.createClient` is a factory for creating a client's singleton, and you should always use it unless you need multiple clients.

> Note that multiple clients is only needed if using default EAS API client, as it provides a different endpoint for every network. If you're using a custom api, you can provide methods to filter by network and avoid client mutation.

The `apiClient` option is used when you want to use a Custom API. The SDK provides a standard custom api that can be initiated with `apiClient: GapIndexerClient(url)` but is also possible to implement your own API in any language and data modeling, and use it as your client, and to do it, create your class and extend the abstract class `Fetcher`:

```ts
// MyCustomApiClient.ts
import { Fetcher } from 'karma-gap-sdk/core/class/Fetcher';

export class MyCustomApiClient extends Fetcher {
  // ... implement all Fetcher methods following its return types and arguments.
}
```

[..] Then you can use it on GapClient. More details about how to implement a custom fetcher on [Chapter 8](#8-custom-api).

```ts
// gap.client.ts;
import { GAP } from 'karma-gap-sdk';
import { MyCustomApiClient } from './MyCustomApiClient.ts';

const gap = GAP.createClient({
  network: 'optimism-goerli', // sepolia, optimism,
  apiClient: new MyCustomApiClient('https://my-custom-api.mydomain.com'),
  // gelatoOpts: for gasless transactions, see it on Chap. 7;
});

export default gap;
```

The `gelatoOpts` is used when the developer wants to provide gasless transactions to the end user, creating a much better user experience. More details about this feature on [Chapter 7](#7-gasless-transactions-with-gelato)

## 4. Getting attestations

After initializing the GAP client, now you're able to fetch for attestations available on this project, such as:

- Communities
- Projects
- Grants
- Grant updates
- Members of Projects
- Milestones
- Milestone updates

Indeed you can get all available attestations, we only provide methods for the higher level attestations, considering that this is the behavior we want, so looking at `Fetcher` interface, we can:

- Get communities with related grants
- Get projects that will contain related members and grants. Considering that grants will contain related updates and milestones, and Milestones will also contain its updates.
- Get grants for grantees
- Get projects from grantees
- Get milestones of a grant
- Get members of a project

To start using the fetcher, just call `gap.fetch.<target>(...args)`, like the following example:

```ts
import { gap } from './gap-client';

gap.fetch.projects().then((res) => {
  res.forEach((project) => {
    console.log(project.details.title);
  });
});

gap.fetch
  .projectBySlug('my-project-slug')
  .then((project) => {
    console.log(project.details.name);
  })
  .catch((er) => {
    console.error(er.message);
  });
```

## 5. Attesting data in a Frontend

Attesting data using the GAP SDK is pretty straight forward. The developer needs only to define what they want to attest, and attest but we have some attesting facilities for this module. To avoid poping up wallet several times to attest for each individual entity, we have developed a special contract that handles multiple attestations and its relationships, such as Project and Project details, with this in hand we can transact once and attest several times. Let's go through an example:

    User wants to create a project, and this project will include:
        1. Its details (title, image, and description);
        2. Two members
        3. A Grant
        4. The grant will get one milestone

> To attest a grant, it will ask for a community so consider that a community already exists. To create a community, the user will need to queue through [this link](https://tally.so/r/wd0jeq).

So, after setting up the GAP client, you can go to:

```ts
// get-dummy-project.ts
import {
  Project,
  ProjectDetails,
  MemberOf,
  Grant,
  GapSchema,
} from 'karma-gap-sdk';

export function getDummyProject() {
  // Creating Project
  const project = new Project({
    data: { project: true },
    schema: GapSchema.find('Project'),
    // Owner address, usually whoever is connected to the app
    recipient: '0xd7d...25f2',
  });

  // Adding details to the project
  project.details = new ProjectDetails({
    data: {
      title: 'My Project',
      description: 'My Description',
      imageURL: 'https://loremflickr.com/320/240/kitten',
      links: [{ type: 'github', url: 'https://github.com/my-org' }],
      tags: [{ name: 'DAO' }, { name: 'UI/UX' }],
    },
    schema: GapSchema.find('ProjectDetails'),
    recipient: project.recipient,
  });

  const member_1 = new MemberOf({
    data: { memberOf: true },
    schema: GapSchema.find('MemberOf'),
    refUID: pro.uid,
    // member 1 address
    recipient: '0x8dC...A8b4',
  });

  const member_2 = new MemberOf({
    data: { memberOf: true },
    schema: GapSchema.find('MemberOf'),
    refUID: pro.uid,
    // member 2 address
    recipient: '0xabc...A7b3',
  });

  // Add members to the project
  project.members.push(member_1, member_2);

  // Creating Grant
  const grant = new Grant({
    // Address of the related community
    data: { communityUID: '0xabc...def' },
    schema: GapSchema.find('Grant'),
    recipient: project.recipient,
  });

  // Adding details to Grant
  grant.details = new GrantDetails({
    data: {
      title: 'Build the Gap App',
      proposalURL: 'https://pantera.com/',
      description: 'Grant Description',
      // cycle: grant cycle, optional
      // season: grant season, optional
    },
    schema: GapSchema.find('GrantDetails'),
    recipient: pro.recipient,
  });

  // Creating milestone
  const milestone = new Milestone({
    data: {
      title: 'Build the Home Page',
      description: 'Milestone Description',
      endsAt: Date.now() + 1000000,
    },
    schema: GapSchema.find('Milestone'),
    recipient: pro.recipient,
  });

  grant.milestones.push(milestone);

  // Add grants to the project
  project.grants.push(grant);

  return project;
}
```

After setting up the project with all its dependencies, it's time to attest, and you'll be able to do it by calling `project.attest` while providing a signer to sign the transaction. The `signer` can be an etherjs wallet or a viem/wagmi provider since it satisfies the `SignerOrProvider` interface. In some cases the EAS api can indicate that those providers does not fit into the signer's interface but most of cases it's easily soved by using `any` typing.

```ts
// useSigner.ts

// wagmi/react example
import { useWalletClient } from 'wagmi';

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);

  return signer;
}

export function useSigner() {
  const { data: walletClient } = useWalletClient();

  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  useEffect(() => {
    async function getSigner() {
      if (!walletClient) return;

      const tmpSigner = walletClientToSigner(walletClient);

      setSigner(tmpSigner);
    }

    getSigner();
  }, [walletClient]);
  return signer;
}
```

Then, in the attestation file:

```ts
import { getDummyProject } from 'util/get-dummy-project';
import { useSigner } from 'util/useSigner';

export const MyComponent: React.FC = () => {
  const signer = useSigner();

  const attestProject = async () => {
    const project = getDummyProject();
    // any typing is required here as it
    // does not naturally fits the EAS
    // SignerOrProvider interface.
    await project.attest(signer as any);
    console.log(
      `Attested Project ${project.details.title} with uid ${project.uid}`
    );
  };
};
```

The past example is related to when a user wants to attest a project with all its relationships but it does not need to follow the same method. It is completely possible to transact sepparated attestations using the property `refUID` for each attestation. As an example, lets say that user wants to add another grant to the project:

```ts
// add-grant-to-project.ts
import { Grant, GrantDetails, GapSchema, Hex } from 'karma-gap-sdk';

export function addGrantToProject(
  grant: IGrantDetails,
  communityUID: Hex,
  recipient: Hex,
  projectUID: Hex
): Grant {
  const grant = new Grant({
    data: { communityUID },
    schema: GapSchema.find('Grant'),
    recipient,
    // The ref UID will create a reference from
    // the current grant to an already attested
    // project
    refUID: projectUID,
  });

  return grant;
}
```

So using the last example, we can get:

```ts
import { getDummyProject } from 'util/get-dummy-project';
import { addGrantToProject } from 'util/add-grant-to-project';
import { Project } from 'karma-gap-sdk';

export const MyComponent: React.FC = () => {
  const signer = useSigner();
  const [project, setProject] = useState<Project>()

  const attestProject = async () => {
    const project = getDummyProject();
    // any typing is required here as it
    // does not naturally fits the EAS
    // SignerOrProvider interface.
    await project.attest(signer as any);
    setProject(project);
    console.log(
      `Attested Project ${project.details.title} with uid ${project.uid}`
    );
  };

  const addGrant = () => {
    if(!project) throw new Error('No project set up.');

    const grant = addGrantToProject(
        {
            title: 'Grant 2',
            description: 'Grant 2 description',
            proposalURL: 'https://example.com'
        },
        communityUID: '0xa...bcde',
        recipient: project.recipient,
        projectUID: project.uid
    );

    await grant.attest(signer as any);
    project.grants.push(grant);
    console.log(`Grant ${grant.details.title} attested with uid ${grant.uid}`)
  };
};
```

> This example can be followed for any kind of attestation that comes later, such as adding milestone to grant, add grant to project, add members to project, and also to update Project, Grant, and Community details. It's also available when approving/rejecting/completing a milestone: if any of those operations is done twice, the latest one will remain.

After any kind of attestation, the SDK will bind UIDs to the objects so it can be accessed after the attestation is done. For example, if you run the project attestation with all its dependents, you'll be able to get the attestation UID of the project, the details, grants, milestones, and so on.

### Revoking an attestation

As every object returned by the `Fetcher` is also an `Attestation`, to revoke any attestation the developer will only need to call `attestation.revoke`:

```ts
// revoke-project.ts
import { SignerOrProvider, Project } from 'karma-gap-sdk';

export async function revokeProject(
  project: Project,
  signer: SignerOrProvider
) {
  await project.revoke(signer);
}
```

### Updating details

To update the details of a Community, Project or Grant, all you need to do is to replace the current details and attest again:

```ts
// update-project-details.ts
import {
  SignerOrProvider,
  Project,
  IProjectDetails,
  ProjectDetails,
  GapSchema,
} from 'karma-gap-sdk';

export async function updateProjectDetails(
  project: Project,
  data: IProjectDetails,
  signer: SignerOrProvider
) {
  project.details = new ProjectDetails({
    data,
    recipient: project.recipient,
    schema: GapSchema.find('ProjectDetails'),
  });

  await project.details.attest(signer);
  console.log(`Project ${project.details.name} was updated.`);

  // You can return the project or not. As it is a reference to
  // the original project, the details will be updated
  // in the previous instance.
  return project;
}
```

> Note that you cannot update Milestone without losing all of its references.

## 6. Attesting data in a Backend

To attest data in the backend, follow the same content available in [Chapter 5](#5-attesting-data-in-a-frontend). The only difference between them is that in the backend you'll need to instantiate an `ethersjs` wallet at runtime to sign attestations.

```ts
import { gap } from 'gap-client';
import { getDummyProject } from 'util/get-dummy-project';

// Create the web3 provider
const web3 = new ethers.providers.JsonRpcProvider(
  'https://my-provider-url.com'
);

// Creating a ethersjs wallet
const wallet = new ethers.Wallet('0xabc...def1', web3);

const project = getDummyProject();

project.attest(wallet as any).then(() => {
  // After attesting, project.uid should be filled.
  console.log(
    `Project ${project.details.name} attested with uid ${project.uid}`
  );
});
```

## 7. Gasless transactions with Gelato

Gasless transactions are a good option when the developer wants to create a user experience and attestation flow. In this SDK, we use [Gelato Relay](https://relay.gelato.network) to sponsor transactions and avoid the user to pay for network fees\*.

> \* This is currently available for all attestations not including milestone completion/approvals/rejection updates as it currently needs another approach for ownership proof. Gasless for these attesations are under development and may be released soon.

Before using it, go to [Gelato Relay](https://relay.gelato.network) app, setup and fund your account for one of the available networks (optimism goerli, sepolia, or optimism mainnet), setup the contract and get your api key.

> The ABI for our contract can be found [here](https://github.com/show-karma/karma-gap-sdk/blob/dev/core/abi/MultiAttester.json).

> To ensure the security of your Gelato account, only enable gasless for `multiSequentialAttest`, `attest`, and `multiRevoke` methods.

Following with how to use gasless transactions, the developer will notice the options below when createing a GAP instance:

````ts
interface GAPArgs {
  // ... Other GAP client constructor arguments
  /**
   * Defined if the transactions will be gasless or not.
   *
   * In case of true, the transactions will be sent through [Gelato](https://gelato.network)
   * and an API key is needed.
   *
   * > __Note that to safely transact through Gelato, the user must
   * have set a handlerUrl and not expose gelato api in the frontend.__
   */
  gelatoOpts?: {
    /**
     * Endpoint in which the transaction will be sent.
     * A custom endpoint will ensure that the transaction will be sent through Gelato
     * and api keys won't be exposed in the frontend.
     *
     * __If coding a backend, you can use `apiKey` prop instead.__
     *
     * `core/utils/gelato/sponsor-handler.ts` is a base handler that can be used
     * together with NextJS API routes.
     *
     * @example
     *
     * ```ts
     * // pages/api/gelato.ts
     * import { handler as sponsorHandler } from "core/utils/gelato/sponsor-handler";
     *
     * export default const handler(req, res) => sponsorHandler(req, res, "GELATO_API_KEY_ENV_VARIABLE");
     *
     * ```
     */
    sponsorUrl?: string;
    /**
     * If true, env_gelatoApiKey will be marked as required.
     * This means that the endpoint at sponsorUrl is contained in this application.
     *
     * E.g. Next.JS api route.
     */
    contained?: boolean;
    /**
     * The env key of gelato api key that will be used in the handler.
     *
     * @example
     *
     * ```
     * // .env
     * GELATO_API_KEY=1234567890
     *
     * // sponsor-handler.ts
     *
     * export async function handler(req, res) {
     *  // ...code
     *
     *  const { env_gelatoApiKey } = GAP.gelatoOpts;
     *
     *  // Will be used to get the key from environment.
     *  const { [env_gelatoApiKey]: apiKey } = process.env;
     *
     *  // send txn
     *  // res.send(result);
     * }
     * ```
     */
    env_gelatoApiKey?: string;
    /**
     * API key to be used in the handler.
     *
     * @deprecated Use this only if you have no option of setting a backend, next/nuxt api route
     * or if this application is a backend.
     *
     * > __This will expose the api key if used in the frontend.__
     */
    apiKey?: string;
    /**
     * If true, will use gelato to send transactions.
     */
    useGasless?: boolean;
  };
}
````

So if `gasless` transactions are required, the developer will need to understand that it can be used in three modes, and all requireto set `gelatoOpts.useGasless: true`:

1. With API Key
   This method is recommended only if you're using it in an external API as if used in the frontend level, the API key will be visible to all of the users. When using this method, you only need to fill `gelatoOpts.apiKey: '<gelato api key>'`. Note that a deprecation warning will pop up with this disclaimer, but don't worry, this option will not be removed from this sdk. The constructor will look like:

```ts
GAP.createClient({
    network: 'optimism-goerli',
    gelatoOpts: {
        apiKey: '<GELATO_API_KEY>'
        // to use gasless. it can be mutated
        // through GAP.useGasless = <boolval>
        useGasless: true
    }
})
```

2. With an external api support
   In this case, you are using an external api such your indexer to provide a sposored transaction url that will communicate with gelato and the api key will not be visible. In this case, you will need to fill only `gelatoOpts.sponsorUrl`.

```ts
GAP.createClient({
    network: 'optimism-goerli',
    gelatoOpts: {
        sponsorUrl: 'https://my-api.mydomain.com/sponsor-url-name'
        // to use gasless. it can be mutated
        // through GAP.useGasless = <boolval>
        useGasless: true
    }
})
```

3. With a self-contained api support
   This case is similar to #2 but the difference is that you're using a self-contained api, such as NextJS Api, that won't require an external backend to request the transaction. In this case, you will need to provide:

```ts
GAP.createClient({
    network: 'optimism-goerli',
    gelatoOpts: {
        sponsorUrl: '/api/my-contained-sponsor-url',
        // marking contained as required will make possible 
        // to send transactions through a NextJS api.
        contained: true,
        // to use gasless. it can be mutated
        // through GAP.useGasless = <boolval>
        useGasless: true
    }
})
```

When using a self-contained api to hide api keys, we provide a plug and play utility to NextJS, that can be used by `import { handler } from karma-gap-sdk`, and placing under `/pages/api/sponsored-txn.ts`:

```ts
// pages/api/sponsored-handler.ts
import { type ApiRequest, handler as sponsorTxnHandler } from 'karma-gap-sdk';
import type { NextApiResponse } from 'next';

const handler = (req: ApiRequest, res: NextApiResponse) =>
  sponsorTxnHandler(req as ApiRequest, res, 'NEXT_GELATO_API_KEY');

export default handler;
```

> Note that `NEXT_GELATO_API_KEY` is not an actualy api key but the env variable name
> to get from process.env. This will not expose the API in the frontend.
> .env would need a field `NEXT_GELATO_API_KEY=abcdefg123`. See [sponsor-handler.ts L63](https://github.com/show-karma/karma-gap-sdk/blob/f2f3f863c8b2b475ca74bd76bb9290a075c12f60/core/utils/gelato/sponsor-handler.ts#L63) for more details.

After the api page placement, set `gelatoOpts.sponsorUrl: '/api/sponsored-txn` and all the transactions from now will be sent through Gelato Relay network.

---

### External API

When using an external API to perform gasless transaction, you'll need to create an endpoint with a structure similar to the example below:

```ts
// gelato/sponsor-handler.ts
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { Gelato } from 'karma-gap-sdk/core/utils/gelato/';
// Exception Handler available under your development.
import { HttpException } from '../error/HttpException';

export type SponsoredCall = [
  {
    data: string;
    chainId: string;
    target: string;
  },
  string,
  {
    retries: number;
  },
];

const assertionObj = [
  {
    data: /0x[a-fA-F0-9]+/gim,
    chainId: /\d+/,
    target: /0x[a-fA-F0-9]{40}/gim,
  },
  /\{apiKey\}/,
  {
    retries: /\d+/,
  },
];

function assert(body: any): body is Parameters<GelatoRelay['sponsoredCall']> {
  if (!Array.isArray(body) || body.length !== assertionObj.length)
    throw new HttpException('Invalid request body: wrong length.', 400);

  assertionObj.forEach((item, index) => {
    // check if objects from assertion Object are present in body
    // and test them using the regexp from the assertion Object
    if (typeof item === 'object') {
      Object.entries(item).forEach(([key, value]) => {
        if (!body[index][key]?.toString().match(value))
          throw new HttpException(
            `Invalid request body: ${value} doesn't match body[${index}][${key}].`,
            400
          );
      });
    }
    // test other items as strings
    else if (!body[index]?.toString().match(item))
      throw new HttpException(
        `Invalid request body: ${item} doesn't match body[${index}].`,
        400
      );
  });

  return true;
}

async function sendTransaction(payload: SponsoredCall) {
  try {
    if (!assert(payload)) return;

    const { GELATO_API_KEY: apiKey } = process.env;
    if (!apiKey) throw new Error('Api key not provided.');

    payload[1] = apiKey;

    const [request, sponsorApiKey, options] = payload;

    const result = await Gelato.sendByApiKey(request, sponsorApiKey, options);
    const txId = await result.wait();

    return { txId, chainId: request.chainId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new HttpException(error.message, 400); // Bad Request
  }
}

const gelato = {
  sendTransaction,
};

export { gelato };
```

> If you want to customize this example, take in consideration that the body of the transaction must be in the format of `SponsoredCall` interface as this interface represents the arguments required in the EAS contract call.

After setting up a custom endpoint, the constructor in your frontend app will look like:

```ts
GAP.createClient({
    network: 'optimism-goerli',
    gelatoOpts: {
        sponsorUrl: 'https://my-api.mydomain.xyz/path/to/sponsored-txn'
        // to use gasless. it can be mutated
        // through GAP.useGasless = <boolval>
        useGasless: true
    }
})
```

This is all the settings needed to enable gasless transactions with GAP SDK, and from now on, users should not pay for gas anymore.

> Note that if you chose this option, you will pay for the gas through gelato.

## 8. Custom API

The SDK provides two methods of fetching data from the network:

1. Using the [EAS GraphQL API](https://optimism-goerli-bedrock.easscan.org/graphql); or
2. Using a custom made API.

When using the default EAS provider, the user will be able to use any feature offered in the SDK however, you'll also notice that it can lead to slow response times. This is caused because of what we can see in diagram on [Chapter 2](#2-architecture): the EAS api architecture doesn't support relationships between attestations then we need to call it several times in order to get the desired result, e.g., a project with all its dependents.

To solve that issue, the SDK includes the `Fetcher` module, and by using it, the developer is allowed to develop their own service and integrate with the SDK. The integration is made by extending the fetcher api and implementing all of its methods. If you are not going to use a method or your service does not support it, you must implement an error handler or an empty return.

You can view the Fetcher interface in [this file](https://github.com/show-karma/karma-gap-sdk/blob/dev/core/class/Fetcher.ts).

```ts
// my-fetcher.ts
import { Fetcher } from 'karma-gap-sdk/core/class/Fetcher.ts';
import { Attestation } from 'karma-gap-sdk';

const Endpoints = {
  projects: {
    byIdOrSlug: (uid: Hex) => `/projects/${uidOrSlug}`,
  },
};

export class MyFetcher extends Fetcher {
  projectById(uid: `0x${string}`): Promise<Project> {
    // Note that the Fetcher class extends an axios utility class
    // and provides a client for performing http requests
    // by calling this.client
    const project = await this.client.get(
      Endpoints.projects.byIdOrSlug(uid) /* ,{...axiosOpts} */
    );

    if (!data) throw new Error('Attestation not found');
    // You need to return a Project instance
    return Project.from([data])[0];
  }

  async projects(name?: string): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>(Endpoints.project.all(), {
      params: {
        'filter[title]': name,
      },
    });

    return Project.from(data);
  }
  // ... other methods
}
```

> You can check a fully implemented client [here](https://github.com/show-karma/karma-gap-sdk/blob/dev/core/class/karma-indexer/GapIndexerClient.ts).

After implementing your own client, you can setup the GAP client:

```ts
// gap.client.ts;
import { GAP } from 'karma-gap-sdk';
import { MyFetcher } from './MyFetcher';

const gap = GAP.createClient({
  network: 'optimism-goerli', // sepolia, optimism,
  // Use your client here
  apiClient: new MyFetcher('https://my-api.mydomain.com'),
});

export default gap;
```

> Note that your api service should return the data specified in the interfaces provided by each Attestation to work properly with this sdk.
