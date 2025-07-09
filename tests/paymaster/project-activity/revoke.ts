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

async function revokeProjectActivity() {
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

    const project: Project | null =
      await gap.fetch.projectBySlug(projectSlugOrUid);

    if (!project) {
      console.error(
        `L Error: Project not found with slug/UID: ${projectSlugOrUid}`
      );
      process.exit(1);
    }

    console.log(
      ` Found project: ${project.details?.data?.title || "Untitled"}`
    );

    console.log("Checking if project already has an activity...");

    const projectHasActivity = project.updates.length > 0;

    if (!projectHasActivity) {
      console.log("Project does not have an activity");
      process.exit(1);
    }

    const activity = project.updates[0];

    const revokeTx = await activity.revoke(kernelClient);

    console.log("=� Transaction details:", {
      transactionHash: revokeTx.tx[0]?.hash,
      attestationUID: revokeTx.uids[0],
      gasUsed: "Sponsored by paymaster (gasless)",
    });

    console.log("\n Project activity revoked successfully!");
  } catch (error) {
    console.error("L Error creating project activity:", error);
    process.exit(1);
  }
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
revokeProjectActivity();
