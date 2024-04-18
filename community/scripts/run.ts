import { ethers } from "ethers";
import { GAP, nullRef } from "../../core";
import { Community, GapIndexerClient, IpfsStorage } from "../../core/class";

interface Metadata {
  description?: string;
  imageURL?: string;
  slug?: string;
}

const [, , communityName, chainId, metadataJson] = process.argv;

const metadata: Metadata = JSON.parse(metadataJson);

const walletAddress = "0x5A4830885f12438E00D8f4d98e9Fe083e707698C";
const GAP_IPFS = "https://gapapi.karmahq.xyz/ipfs";
const GAP_API = "https://gapapi.karmahq.xyz";
const PRIVATE_KEY = "";

async function bootstrap() {
  if (!communityName) {
    throw new Error("Please provide a community name");
  }
  if (!chainId) {
    throw new Error("Please provide a chainID");
  }
  if (!metadataJson) {
    throw new Error("Please provide a metadataJson");
  }

  const networks = {
    42161: {
      name: "arbitrum",
      key: "okcKBSKXvLuSCbas6QWGvKuh-IcHHSOr",
    },
    10: {
      name: "optimism",
      key: "fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl",
    },
    11155420: {
      name: "optimism-sepolia",
      key: "9FEqTNKmgO7X7ll92ALJrEih7Jjhldf-",
    },
    // other networks
  };

  const web3 = new ethers.AlchemyProvider(
    networks[chainId].name,
    networks[chainId].key
  );
  const wallet = new ethers.Wallet(PRIVATE_KEY, web3 as any);

  const gap = new GAP({
    network: networks[chainId].name,
    apiClient: new GapIndexerClient(GAP_API),
  });

  try {
    const newCommunity = new Community({
      data: {
        community: true,
      },
      schema: gap.findSchema("Community"),
      refUID: nullRef,
      recipient: walletAddress,
      uid: nullRef,
    });
    if (await gap.fetch.slugExists(metadata.slug as string)) {
      metadata.slug = await gap.generateSlug(metadata.slug as string);
    }
    // console.log("Attesting community with metadata", newCommunity.schema.uid);
    await newCommunity.attest(wallet as any, {
      name: communityName,
      description: metadata.description as string,
      imageURL: metadata.imageURL as string,
      slug: metadata.slug as string,
    });
  } catch (error) {
    console.log(error);
  }
}

bootstrap();
