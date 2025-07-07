import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
import { Project } from "./core/class";
import { ProjectDetails } from "./core/class/types/attestations";
import { Hex } from "./core/types";
import { createKernelAccount } from "@zerodev/sdk";
import { createPublicClient, http } from "viem";
import { optimismSepolia } from "viem/chains";
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { getKernelClient } from "./utils/getKernelClient";

/**
 * Example: Using ZeroDev KernelClient with Paymaster for Gasless Transactions
 *
 * This example demonstrates how to integrate ZeroDev's smart account functionality
 * with paymaster support for gasless transactions in the Karma GAP SDK.
 *
 * Prerequisites:
 * 1. Install ZeroDev packages: `npm install @zerodev/sdk`
 * 2. Set up a ZeroDev project and get your project ID
 * 3. Configure paymaster for gas sponsorship
 *
 * @see https://docs.zerodev.app/sdk/core-api/send-transactions
 * @see https://docs.zerodev.app/sdk/core-api/sponsor-gas
 */

// Configuration - Replace these with your actual values
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex; // Your private key
const API_URL = "https://gapstagapi.karmahq.xyz";
const BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/b544be61-1477-4540-a5c3-5325cd4596f3";
const PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/b544be61-1477-4540-a5c3-5325cd4596f3";

const kernelVersion = KERNEL_V3_1;
const entryPoint = getEntryPoint("0.7");

async function zeroDevExample() {
  try {
    console.log("🔧 Setting up ZeroDev KernelClient...");

    // Validate environment setup
    if (!PRIVATE_KEY) {
      console.log("⚠️  PRIVATE_KEY not found in environment variables.");
      console.log(
        "📝 Using demo private key for testing. DO NOT use this in production!"
      );
      console.log(
        "💡 To set your private key: export PRIVATE_KEY=your_private_key_here"
      );
    }

    // Step 1: Create ZeroDev KernelClient (this would typically come from ZeroDev SDK)
    const kernelClient = await createKernelClientExample();

    // Step 2: Initialize GAP SDK with ZeroDev configuration
    const gap = new GAP({
      network: "optimism-sepolia",
      apiClient: new GapIndexerClient(API_URL),
      zeroDevOpts: {
        enabled: true,
      },
    });

    console.log(
      "✅ GAP SDK initialized with ZeroDev enabled for gasless transactions"
    );

    // Step 3: Demonstrate creating a new project with ZeroDev KernelClient
    console.log("🚀 Creating a new project with ZeroDev KernelClient...");
    await createProjectExample(gap, kernelClient);

    console.log(
      "✨ ZeroDev paymaster integration example completed successfully!"
    );
  } catch (error) {
    console.error("❌ Error in ZeroDev example:", error);
  }
}

/**
 * Example function that creates a new project using ZeroDev KernelClient
 * This demonstrates gasless project creation with ZeroDev paymaster
 */
async function createProjectExample(
  gap: GAP,
  kernelClient: any
): Promise<void> {
  try {
    console.log("📝 Creating a new project with ZeroDev KernelClient...");

    // Create a new project instance
    const project = new Project({
      data: {
        project: true,
      },
      schema: gap.findSchema("Project"),
      recipient: kernelClient.account?.address,
    });

    // Add project details
    project.details = new ProjectDetails({
      data: {
        title: "ZeroDev Test Project",
        description:
          "A test project created with ZeroDev KernelClient and paymaster for gasless transactions",
        imageURL: "https://via.placeholder.com/150",
        slug: `zerodev-test-project-${Date.now()}`, // Unique slug
      },
      schema: gap.findSchema("ProjectDetails"),
      recipient: kernelClient.account?.address,
    });

    console.log("💡 Project details:", {
      title: project.details.data.title,
      description: project.details.data.description,
      slug: project.details.data.slug,
      recipient: kernelClient.account?.address,
    });

    // Attest the project using ZeroDev KernelClient with paymaster
    console.log("⛽ Creating project with ZeroDev paymaster (gasless)...");
    const projectTx = await project.attest(kernelClient);

    console.log("🎉 Project created successfully with ZeroDev paymaster!");
    console.log("📄 Transaction details:", {
      transactionHash: projectTx.tx[0]?.hash,
      attestationUIDs: projectTx.uids,
      gasUsed: "Sponsored by paymaster (gasless)",
    });

    console.log("✅ Project creation example completed!");
  } catch (error) {
    console.error("❌ Error creating project with ZeroDev:", error);

    // If it's a known API error, provide helpful guidance
    if (error.response?.status === 422) {
      console.log(
        "💡 This might be due to API configuration or network issues."
      );
    }
  }
}

/**
 * Example function to create a KernelClient
 * In practice, you would use ZeroDev's SDK to create this
 */
async function createKernelClientExample(): Promise<any> {
  // Create a simpler public client to avoid type conflicts
  const publicClient = createPublicClient({
    transport: http(BUNDLER_URL),
    chain: optimismSepolia,
  });

  // Use the provided private key or fallback to demo key
  const privateKey = PRIVATE_KEY;
  const signer = privateKeyToAccount(privateKey);

  // Use type assertion to bypass compatibility issues between viem and ZeroDev
  const ecdsaValidator = await signerToEcdsaValidator(publicClient as any, {
    signer,
    entryPoint,
    kernelVersion,
  });

  const account = await createKernelAccount(publicClient as any, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion,
  });

  const kernelClient = await getKernelClient({
    account,
    chain: optimismSepolia,
    bundlerURL: BUNDLER_URL,
    paymasterURL: PAYMASTER_URL,
  });

  return kernelClient;
}

const checkOwner = async () => {
  const address = "0xee37ae8c477f30de832811030183f19ad562b73a";
  const projectId = "test-op-sepolia";

  const rpcClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(
      "https://opt-sepolia.g.alchemy.com/v2/duRh1PCchyub9TDtSaus4"
    ),
  });

  const gap = new GAP({
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });
  const projectInstance = await gap.fetch.projectBySlug(projectId);

  const [isOwnerResult, isAdminResult] = await Promise.all([
    projectInstance?.isOwner(rpcClient as any, address).catch((error) => {
      console.log(error);
      return false;
    }),
    projectInstance?.isAdmin(rpcClient as any, address).catch((error) => {
      console.log(error);
      return false;
    }),
  ]);

  console.log(isOwnerResult, isAdminResult);
};

checkOwner();
