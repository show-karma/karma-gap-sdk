import {
  createWalletClient,
  createPublicClient,
  http,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";
import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
// import { viemAdapter } from "@delvtech/drift-viem"; // Optional adapter for better performance
import {
  Hex,
  MultiAttestPayload,
  MultiRevokeArgs,
  SignerOrProvider,
} from "./core/types";
import { Milestone } from "./core/class/entities/Milestone";
import { Grant } from "./core/class/entities/Grant";
import {
  IMilestoneCompleted,
  MilestoneCompleted,
} from "./core/class/types/attestations";
import { GapContract } from "./core/class/contract/GapContract";

// Configuration
const API_URL = "https://gapstagapi.karmahq.xyz";
const PROJECT_ID = "your-project-id-here"; // Replace with your actual project ID or slug
const RPC_URL = "your-rpc-url-here"; // Replace with your RPC URL
const PRIVATE_KEY = "0x..." as Hex; // Replace with your private key (must start with 0x)

async function main() {
  try {
    // Initialize viem clients
    const account = privateKeyToAccount(PRIVATE_KEY);

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
    console.log(`Using signer address: ${signerAddress}`);

    // Initialize GAP SDK with viem
    // Option 1: Direct usage (SDK will handle viem compatibility)
    const gap = new GAP({
      globalSchemas: false,
      network: "optimism-sepolia",
      apiClient: new GapIndexerClient(API_URL),
    });

    // Option 2: Using viem adapter for better performance (if you have the adapter package)
    // const gap = new GAP({
    //   globalSchemas: false,
    //   network: "optimism-sepolia",
    //   apiClient: new GapIndexerClient(API_URL),
    //   adapter: viemAdapter({ publicClient, walletClient }),
    // });

    // 1. Fetch a project by ID or slug
    console.log(`Fetching project: ${PROJECT_ID}`);
    const project = await (PROJECT_ID.startsWith("0x")
      ? gap.fetch.projectById(PROJECT_ID as Hex)
      : gap.fetch.projectBySlug(PROJECT_ID));

    if (!project) {
      throw new Error(`Project not found: ${PROJECT_ID}`);
    }

    // Project may have details with title, or we can use UID
    const projectName = project.details?.title || project.uid;
    console.log(`Project found: ${projectName}`);

    // 2. Fetch grants associated with the project
    console.log("Fetching grants for the project...");
    const grants = await gap.fetch.grantsFor([project], true);

    if (!grants || grants.length === 0) {
      throw new Error("No grants found for this project");
    }

    console.log(`Found ${grants.length} grants`);

    // Get grant UIDs for milestone creation
    const grantUIDs = grants.map((grant) => grant.uid);

    // 3. Create milestones for all grants in batches
    const milestones = [
      {
        title: "Research Phase - Viem Example",
        description: "Complete initial research and planning using viem",
        endsAt: Math.floor(Date.now() / 1000) + 86400 * 14, // 14 days from now
        priority: 1,
      },
      {
        title: "Development Phase - Viem Example",
        description: "Implement core functionality with viem integration",
        endsAt: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
        priority: 2,
      },
      {
        title: "Testing Phase - Viem Example",
        description: "Comprehensive testing with viem wallet client",
        endsAt: Math.floor(Date.now() / 1000) + 86400 * 45, // 45 days from now
        priority: 3,
      },
    ];

    console.log("Creating milestones for all grants in batches...");

    // Array to store created milestones for completion
    const createdMilestones: { milestone: Milestone; uids: Hex[] }[] = [];

    // Process each milestone type and create it for all grants at once
    for (const milestoneData of milestones) {
      try {
        console.log(
          `Creating milestone: ${milestoneData.title} for all grants`
        );

        // Create a milestone template
        const milestone = new Milestone({
          schema: gap.findSchema("Milestone"),
          recipient: signerAddress,
          data: milestoneData,
          // No refUID here - we'll attest to multiple grants
        });

        console.log(`Milestone schema UID: ${milestone.schema.uid}`);
        console.log(`Grant UIDs: ${JSON.stringify(grantUIDs)}`);

        console.log(`Attesting to ${grantUIDs.length} grants...`);

        // Use the attestToMultipleGrants with viem wallet client
        const attestResult = await milestone.attestToMultipleGrants(
          walletClient as any, // The SDK handles viem compatibility internally
          grantUIDs,
          (status) => console.log(`Attestation status: ${status}`)
        );

        console.log(
          `Successfully attested milestone to ${attestResult.uids.length} grants. UIDs:`,
          attestResult.uids
        );

        // Store the milestone and UIDs for later completion
        createdMilestones.push({
          milestone,
          uids: attestResult.uids,
        });
      } catch (error) {
        console.error(
          `Error creating milestone "${milestoneData.title}" for all grants:`,
          error
        );
      }
    }

    // 4. Complete all milestones in batches
    console.log("Completing milestones in batches...");

    for (const { milestone, uids } of createdMilestones) {
      try {
        console.log(
          `Completing milestone: ${milestone.title} across all grants...`
        );

        const completionData: IMilestoneCompleted = {
          type: "completed",
          reason: "Work completed successfully with viem",
          proofOfWork: "https://github.com/your-org/your-repo/pull/viem-123",
        };

        console.log(
          `Completing ${uids.length} milestones with completeForMultipleGrants...`
        );

        // Complete all milestones with viem wallet client
        const completeResult = await milestone.completeForMultipleGrants(
          walletClient as any, // The SDK handles viem compatibility internally
          uids,
          completionData,
          (status) => console.log(`Completion status: ${status}`)
        );

        console.log(
          `Successfully completed milestones. UIDs:`,
          completeResult.uids
        );

        // 5. (Optional) Demonstrate milestone revocation
        console.log("Demonstrating milestone revocation using viem...");

        console.log(`Milestone UIDs to revoke: ${JSON.stringify(uids)}`);

        // Get the milestone schema
        const milestoneSchema = gap.findSchema("Milestone");
        console.log(`Milestone schema UID: ${milestoneSchema.uid}`);

        // Prepare the revocation arguments
        const revocationArgs: MultiRevokeArgs[] = uids.map((uid) => ({
          schemaId: milestoneSchema.uid,
          uid,
        }));

        console.log(revocationArgs);

        // Use the revokeMultipleAttestations method with viem
        const revokeResult = await milestone.revokeMultipleAttestations(
          walletClient as any, // The SDK handles viem compatibility internally
          revocationArgs,
          (status) => console.log(`Revocation status: ${status}`)
        );

        console.log(
          `Successfully revoked ${
            uids.length
          } milestone attestations. Transaction hash: ${
            revokeResult.tx[0].hash || "unknown"
          }`
        );
      } catch (error) {
        console.error(
          `Error processing milestone "${milestone.title}":`,
          error
        );
      }
    }

    console.log("All milestone operations completed with viem!");
  } catch (error) {
    console.error("Error in viem workflow:", error);
  }
}

async function deleteMilestonesViem(milestoneUIDs: Hex[]) {
  try {
    // Initialize viem clients
    const account = privateKeyToAccount(PRIVATE_KEY);

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
    console.log(`Using signer address: ${signerAddress}`);

    // Initialize GAP SDK
    const gap = new GAP({
      globalSchemas: false,
      network: "optimism-sepolia",
      apiClient: new GapIndexerClient(API_URL),
    });

    // 1. Fetch a project by ID or slug
    console.log(`Fetching project: ${PROJECT_ID}`);
    const project = await (PROJECT_ID.startsWith("0x")
      ? gap.fetch.projectById(PROJECT_ID as Hex)
      : gap.fetch.projectBySlug(PROJECT_ID));

    if (!project) {
      throw new Error(`Project not found: ${PROJECT_ID}`);
    }

    // Project may have details with title, or we can use UID
    const projectName = project.details?.title || project.uid;
    console.log(`Project found: ${projectName}`);

    // 2. Fetch grants associated with the project
    console.log("Fetching grants for the project...");
    const grants = await gap.fetch.grantsFor([project], true);

    if (!grants || grants.length === 0) {
      throw new Error("No grants found for this project");
    }

    const milestoneInstances = grants
      .filter((grant) => grant.milestones.length > 0)
      .flatMap((grant) => grant.milestones)
      .filter((milestone) => milestoneUIDs.includes(milestone.uid));

    const groupedByChain = milestoneInstances.reduce(
      (acc, instance) => {
        const chainId = instance.chainID;
        if (!acc[chainId]) {
          acc[chainId] = [];
        }
        acc[chainId].push(instance);
        return acc;
      },
      {} as Record<number, Milestone[]>
    );
    const arrayOfChains = Object.keys(groupedByChain).map(Number);

    for (const chainId of arrayOfChains) {
      const firstInstance = groupedByChain[chainId][0];
      try {
        console.log("Demonstrating milestone revocation using viem...");

        // Get the milestone schema
        const milestoneSchema = gap.findSchema("Milestone");
        console.log(`Milestone schema UID: ${milestoneSchema.uid}`);

        // Prepare the revocation arguments
        const revocationArgs: MultiRevokeArgs[] = milestoneUIDs.map((uid) => ({
          schemaId: milestoneSchema.uid,
          uid,
        }));

        console.log(revocationArgs);

        // Use the revokeMultipleAttestations method with viem
        const revokeResult = await firstInstance.revokeMultipleAttestations(
          walletClient as any, // The SDK handles viem compatibility internally
          revocationArgs,
          (status) => console.log(`Revocation status: ${status}`)
        );

        console.log(
          `Successfully revoked ${
            revokeResult.tx.length
          } milestone attestations. Transaction hash: ${
            revokeResult.tx[0].hash || "unknown"
          }`
        );
      } catch (error) {
        console.error(
          `Error processing milestone "${firstInstance.title}":`,
          error
        );
      }
    }

    console.log("All milestone operations completed with viem!");
  } catch (error) {
    console.error("Error in viem workflow:", error);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Example of deleting specific milestones
// deleteMilestonesViem([
//   "0x1b78c2e7babceddd4c23cd7c6e50e513a0bc265a4d2c6f6b278189ca6ab17cbd",
//   "0x7e0b1712fcee46f36a32ba826233beba9cb79c163500e93855ee440a141512f8",
// ]);
