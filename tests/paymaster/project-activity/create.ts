import { GAP } from "../../../core/class/GAP";
import { GapIndexerClient } from "../../../core/class/karma-indexer/GapIndexerClient";
import { Project, ProjectUpdate } from "../../../core/class";
import { ProjectDetails } from "../../../core/class/types/attestations";
import { Hex } from "../../../core/types";
import { createKernelAccount } from "@zerodev/sdk";
import { createPublicClient, http } from "viem";
import { optimismSepolia } from "viem/chains";
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { getKernelClient } from "../../../utils/getKernelClient";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const API_URL = "https://gapstagapi.karmahq.xyz";
const BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/b544be61-1477-4540-a5c3-5325cd4596f3";
const PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/b544be61-1477-4540-a5c3-5325cd4596f3";

const kernelVersion = KERNEL_V3_1;
const entryPoint = getEntryPoint("0.7");

async function createProjectActivity() {
  try {
    const args = process.argv.slice(2);
    const projectSlugOrUid = args[0];

    if (!projectSlugOrUid) {
      console.error(
        "L Error: Please provide a project slug or UID as an argument"
      );
      console.log("Usage: npm run test:project-activity <project-slug-or-uid>");
      process.exit(1);
    }

    console.log("=' Setting up ZeroDev KernelClient...");

    if (!PRIVATE_KEY) {
      console.error("L Error: PRIVATE_KEY not found in environment variables");
      process.exit(1);
    }

    // Step 1: Create ZeroDev KernelClient
    const kernelClient = await createKernelClient();

    // Step 2: Initialize GAP SDK
    const gap = new GAP({
      network: "optimism-sepolia",
      apiClient: new GapIndexerClient(API_URL),
      zeroDevOpts: {
        enabled: true,
      },
    });

    console.log(" GAP SDK initialized with ZeroDev enabled");

    // Step 3: Fetch the project
    console.log(`=� Fetching project: ${projectSlugOrUid}`);

    let project: Project | null = null;

    // Try to fetch by slug first, then by UID if that fails
    project = await gap.fetch.projectBySlug(projectSlugOrUid);

    if (!project) {
      console.error(
        `L Error: Project not found with slug/UID: ${projectSlugOrUid}`
      );
      process.exit(1);
    }

    console.log(
      ` Found project: ${project.details?.data?.title || "Untitled"}`
    );

    // Step 4: Create a project update (activity)
    console.log("=� Creating project activity (update)...");

    const projectUpdate = new ProjectUpdate({
      data: {
        title: `Activity Update - ${new Date().toISOString()}`,
        text: "This is a test project activity created using ZeroDev paymaster for gasless transactions",
        type: "progress",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        indicators: [
          {
            name: "Test Milestone",
            indicatorId: "test-milestone-1",
          },
        ],
        deliverables: [
          {
            name: "Test Deliverable",
            proof: "https://example.com/proof",
            description: "A test deliverable for the project activity",
          },
        ],
      },
      schema: gap.findSchema("ProjectUpdate"),
      recipient: kernelClient.account?.address,
      refUID: project.uid,
    });

    console.log("=� Project activity details:", {
      title: projectUpdate.data.title,
      text: projectUpdate.data.text,
      type: projectUpdate.data.type,
      projectRef: project.uid,
      recipient: kernelClient.account?.address,
    });

    // Step 5: Attest the project update using ZeroDev KernelClient
    console.log(
      "� Creating project activity with ZeroDev paymaster (gasless)..."
    );

    const updateTx = await projectUpdate.attest(
      kernelClient,
      (status: string) => {
        console.log(`=� Transaction status: ${status}`);
      }
    );

    console.log("<� Project activity created successfully!");
    console.log("=� Transaction details:", {
      transactionHash: updateTx.tx[0]?.hash,
      attestationUID: updateTx.uids[0],
      gasUsed: "Sponsored by paymaster (gasless)",
    });

    console.log("\n Project activity creation completed!");
    console.log(
      `View the attestation: https://optimism-sepolia.easscan.org/attestation/view/${updateTx.uids[0]}`
    );
  } catch (error) {
    console.error("L Error creating project activity:", error);
  }
  process.exit(1);
}

async function createKernelClient(): Promise<any> {
  const publicClient = createPublicClient({
    transport: http(BUNDLER_URL),
    chain: optimismSepolia,
  });

  const privateKey = PRIVATE_KEY;
  const signer = privateKeyToAccount(privateKey);

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

// Run the script
createProjectActivity();
