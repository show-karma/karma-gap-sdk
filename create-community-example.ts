import { ethers } from "ethers";
import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
import { Community } from "./core/class/entities/Community";
import { ICommunityDetails } from "./core/class/types/attestations";
import { Hex } from "./core/types";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || "https://gapstagapi.karmahq.xyz";
const RPC_URL = process.env.RPC_URL || "https://sepolia.optimism.io"; // Replace with your RPC URL
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your private key from .env file

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not found in .env file");
}

// Community data
const COMMUNITY_DATA = {
  name: "Polygon",
  description: "A polygon community",
  imageURL:
    "https://polygontechnology.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F51562dc1-1dc5-4484-bf96-2aeac848ae2f%2Ff0ed090e-4957-4520-8b0c-56d5ec80a17f%2FPolygon_Icon_White_Purple_Rn-3.png?id=fdedfbfe-e6e1-430e-ac7c-b2fb988b47b9&table=block&spaceId=51562dc1-1dc5-4484-bf96-2aeac848ae2f&width=2000&userId=&cache=v2",
  slug: "polygon", // Optional - will be auto-generated if not provided
  links: [],
  type: "community-details",
};
async function main() {
  try {
    console.log("=== Creating Community ===\n");

    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = (await signer.getAddress()) as `0x${string}`;

    console.log(`Using signer address: ${signerAddress}`);

    // Initialize GAP SDK
    const gap = new GAP({
      globalSchemas: false,
      network: "optimism-sepolia", // Change to your target network (e.g., "optimism", "arbitrum")
      apiClient: new GapIndexerClient(API_URL),
    });

    console.log("GAP SDK initialized\n");

    // Generate a unique slug if not provided
    let communityDetails: ICommunityDetails = { ...COMMUNITY_DATA };
    if (!communityDetails.slug) {
      console.log("Generating slug...");
      communityDetails.slug = await gap.generateSlug(communityDetails.name);
      console.log(`Generated slug: ${communityDetails.slug}\n`);
    }

    // Create the community attestation
    console.log("Creating community attestation...");
    const community = new Community({
      schema: gap.findSchema("Community"),
      recipient: signerAddress,
      data: {
        community: true,
      },
    });

    // Attest the community with its details
    console.log("Attesting community to blockchain...\n");
    const result = await community.attest(
      signer,
      communityDetails,
      (status: string) => {
        console.log(`Status: ${status}`);
      }
    );

    console.log("\n✅ Community created successfully!");
    console.log(`Community UID: ${result.uids[0]}`);
    if (result.uids[1]) {
      console.log(`Community Details UID: ${result.uids[1]}`);
    }
    console.log(`Transaction Hash: ${result.tx[0].hash}`);
    console.log(
      `\nYou can view your community at: https://gap.karmahq.xyz/community/${communityDetails.slug}`
    );

    // Fetch the created community to verify
    console.log("\nVerifying community creation...");
    const fetchedCommunity = await gap.fetch.communityBySlug(
      communityDetails.slug
    );

    if (fetchedCommunity) {
      console.log("✅ Community verified!");
      console.log(`Community Name: ${fetchedCommunity.details?.name}`);
      console.log(
        `Community Description: ${fetchedCommunity.details?.description}`
      );
    } else {
      console.log("⚠️ Community not yet indexed (this may take a few moments)");
    }
  } catch (error) {
    console.error("\n❌ Error creating community:", error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
