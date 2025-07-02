/**
 * Karma GAP SDK - Dual Provider Usage Example
 *
 * This example demonstrates how the SDK works seamlessly with both
 * ethers.js and viem providers, allowing developers to choose their
 * preferred library without changing their SDK code.
 */

// Import ethers dependencies
import { ethers } from "ethers";

// Import viem dependencies
import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex as ViemHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";

// Import SDK
import { GAP } from "../core/class/GAP";
import { GapIndexerClient } from "../core/class/karma-indexer/GapIndexerClient";
import { Hex, SignerOrProvider } from "../core/types";

// Configuration
const API_URL = "https://gapstagapi.karmahq.xyz";
const RPC_URL = process.env.RPC_URL || "https://sepolia.optimism.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x..."; // Your private key

/**
 * Example 1: Using Ethers.js
 */
async function exampleWithEthers() {
  console.log("=== Example 1: Using Ethers.js ===\n");

  // Create ethers provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const signerAddress = await signer.getAddress();

  console.log(`Ethers signer address: ${signerAddress}`);

  // Initialize GAP SDK
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });

  // Create a community attestation
  const communityData = {
    community: true,
  };

  const communityTx = await gap.attest({
    schemaName: "Community",
    data: communityData,
    to: signerAddress as Hex,
    signer: signer,
  });

  console.log(`Community created with ethers. TX: ${communityTx.tx[0].hash}`);

  // Create community details
  const communityDetailsData = {
    name: "Ethers Test Community",
    description: "A community created with ethers.js",
    imageURL: "https://example.com/ethers-community.png",
    slug: `ethers-community-${Date.now()}`,
  };

  const detailsTx = await gap.attest({
    schemaName: "CommunityDetails",
    data: communityDetailsData,
    to: signerAddress as Hex,
    signer: signer,
    refUID: communityTx.uids[0],
  });

  console.log(`Community details added. TX: ${detailsTx.tx[0].hash}`);
  console.log(`Community UID: ${communityTx.uids[0]}`);

  return { communityUID: communityTx.uids[0], detailsUID: detailsTx.uids[0] };
}

/**
 * Example 2: Using Viem
 */
async function exampleWithViem() {
  console.log("\n=== Example 2: Using Viem ===\n");

  // Create viem account and clients
  const account = privateKeyToAccount(PRIVATE_KEY as ViemHex);

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http(RPC_URL),
  });

  const signerAddress = account.address;
  console.log(`Viem signer address: ${signerAddress}`);

  // Initialize GAP SDK - Same API as ethers!
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });

  // Create a community attestation - Same code structure!
  const communityData = {
    community: true,
  };

  const communityTx = await gap.attest({
    schemaName: "Community",
    data: communityData,
    to: signerAddress,
    signer: walletClient as any, // SDK handles viem compatibility internally
  });

  console.log(`Community created with viem. TX: ${communityTx.tx[0].hash}`);

  // Create community details - Same API!
  const communityDetailsData = {
    name: "Viem Test Community",
    description: "A community created with viem",
    imageURL: "https://example.com/viem-community.png",
    slug: `viem-community-${Date.now()}`,
  };

  const detailsTx = await gap.attest({
    schemaName: "CommunityDetails",
    data: communityDetailsData,
    to: signerAddress,
    signer: walletClient as any, // SDK handles viem compatibility internally
    refUID: communityTx.uids[0],
  });

  console.log(`Community details added. TX: ${detailsTx.tx[0].hash}`);
  console.log(`Community UID: ${communityTx.uids[0]}`);

  return { communityUID: communityTx.uids[0], detailsUID: detailsTx.uids[0] };
}

/**
 * Example 3: Advanced Usage - Contract Interactions
 */
async function advancedExampleBothProviders() {
  console.log("\n=== Example 3: Advanced Contract Interactions ===\n");

  // Setup both providers
  const ethersProvider = new ethers.JsonRpcProvider(RPC_URL);
  const ethersSigner = new ethers.Wallet(PRIVATE_KEY, ethersProvider);

  const viemAccount = privateKeyToAccount(PRIVATE_KEY as ViemHex);
  const viemWalletClient = createWalletClient({
    account: viemAccount,
    chain: optimismSepolia,
    transport: http(RPC_URL),
  });

  // Initialize GAP
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });

  // Example: Getting contract instances
  console.log("Getting contract instances with both providers...");

  // With ethers
  const multicallEthers = await GAP.getMulticall(ethersSigner);
  console.log(
    "✅ Multicall contract (ethers):",
    multicallEthers.contractAddress || "loaded"
  );

  // With viem
  const multicallViem = await GAP.getMulticall(viemWalletClient as any);
  console.log(
    "✅ Multicall contract (viem):",
    (multicallViem as any).contractAddress || "loaded"
  );

  // Example: Creating a project with milestones
  async function createProjectWithMilestones(
    signer: SignerOrProvider,
    providerName: string
  ) {
    console.log(`\nCreating project with ${providerName}...`);

    const signerAddress = await ("getAddress" in signer
      ? signer.getAddress()
      : (signer as any).account.address);

    // Create project
    const projectData = { project: true };
    const projectTx = await gap.attest({
      schemaName: "Project",
      data: projectData,
      to: signerAddress as Hex,
      signer: signer,
    });

    // Add project details
    const projectDetailsData = {
      title: `${providerName} Test Project`,
      description: `A project created with ${providerName}`,
      imageURL: `https://example.com/${providerName.toLowerCase()}-project.png`,
      slug: `${providerName.toLowerCase()}-project-${Date.now()}`,
    };

    await gap.attest({
      schemaName: "ProjectDetails",
      data: projectDetailsData,
      to: signerAddress as Hex,
      signer: signer,
      refUID: projectTx.uids[0],
    });

    console.log(
      `✅ Project created with ${providerName}: ${projectTx.uids[0]}`
    );
    return projectTx.uids[0];
  }

  // Create projects with both providers
  const ethersProjectUID = await createProjectWithMilestones(
    ethersSigner,
    "Ethers"
  );
  const viemProjectUID = await createProjectWithMilestones(
    viemWalletClient as any,
    "Viem"
  );

  return { ethersProjectUID, viemProjectUID };
}

/**
 * Example 4: Reading Data (Provider-agnostic)
 */
async function readingDataExample() {
  console.log("\n=== Example 4: Reading Data (Works with any setup) ===\n");

  // Initialize GAP without any signer - just for reading
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });

  // Fetch communities
  console.log("Fetching communities...");
  const communities = await gap.fetch.communities();
  console.log(`Found ${communities.length} communities`);

  if (communities.length > 0) {
    const firstCommunity = communities[0];
    console.log(
      `\nFirst community: ${firstCommunity.details?.name || firstCommunity.uid}`
    );

    // Fetch grants for this community
    const grants = await gap.fetch.grantsByCommunity(firstCommunity.uid);
    console.log(`This community has ${grants.length} grants`);
  }

  // Search for projects
  console.log("\nSearching for projects...");
  const projects = await gap.fetch.projects();
  console.log(`Found ${projects.length} projects`);

  return {
    communitiesCount: communities.length,
    projectsCount: projects.length,
  };
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log("🚀 Karma GAP SDK - Dual Provider Examples\n");
  console.log(
    "This demo shows how the SDK works seamlessly with both ethers.js and viem.\n"
  );

  try {
    // Example 1: Ethers.js
    const ethersResult = await exampleWithEthers();
    console.log("✅ Ethers.js example completed\n");

    // Example 2: Viem
    const viemResult = await exampleWithViem();
    console.log("✅ Viem example completed\n");

    // Example 3: Advanced usage
    const advancedResult = await advancedExampleBothProviders();
    console.log("✅ Advanced examples completed\n");

    // Example 4: Reading data
    const readResult = await readingDataExample();
    console.log("✅ Reading data example completed\n");

    console.log("🎉 All examples completed successfully!");
    console.log("\nSummary:");
    console.log("- Ethers community:", ethersResult.communityUID);
    console.log("- Viem community:", viemResult.communityUID);
    console.log("- Projects created:", 2);
    console.log("- Total communities found:", readResult.communitiesCount);
    console.log("- Total projects found:", readResult.projectsCount);
  } catch (error) {
    console.error("❌ Error in examples:", error);
  }
}

// Run the examples
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export functions for testing
export {
  exampleWithEthers,
  exampleWithViem,
  advancedExampleBothProviders,
  readingDataExample,
};
