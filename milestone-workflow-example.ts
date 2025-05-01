import { ethers } from "ethers";
import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
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
const PRIVATE_KEY = "your-private-key-here"; // Replace with your private key

async function main() {
  try {
    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = (await signer.getAddress()) as `0x${string}`;

    console.log(`Using signer address: ${signerAddress}`);

    // Initialize GAP SDK
    const gap = new GAP({
      globalSchemas: false,
      network: "optimism-sepolia", // Change to your target network
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

    console.log(`Found ${grants.length} grants`);

    // Get grant UIDs for milestone creation
    const grantUIDs = grants.map((grant) => grant.uid);

    // 3. Create milestones for all grants in batches - using approach that works in frontend
    const milestones = [
      {
        title: "123 123 123",
        description: "Complete initial research and planning",
        endsAt: Math.floor(Date.now() / 1000) + 86400 * 14, // 14 days from now
        priority: 1,
      },
      //   {
      //     title: "Development Phase",
      //     description: "Implement core functionality",
      //     endsAt: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
      //     priority: 2,
      //   },
      //   {
      //     title: "Testing Phase",
      //     description: "Comprehensive testing and bug fixes",
      //     endsAt: Math.floor(Date.now() / 1000) + 86400 * 45, // 45 days from now
      //     priority: 3,
      //   },
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

        // Use the enhanced attestToMultipleGrants that now accepts grant UIDs directly
        const attestResult = await milestone.attestToMultipleGrants(
          signer,
          grantUIDs, // Pass grant UIDs directly
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
          reason: "Work completed successfully",
          proofOfWork: "https://github.com/your-org/your-repo/pull/123", // Replace with actual proof of work
        };

        // Now we can use the enhanced completeForMultipleGrants method directly with UIDs
        console.log(
          `Completing ${uids.length} milestones with completeForMultipleGrants...`
        );

        // Complete all milestones with a single method call
        const completeResult = await milestone.completeForMultipleGrants(
          signer,
          uids, // Pass milestone UIDs directly - will be detected automatically
          completionData,
          (status) => console.log(`Completion status: ${status}`)
        );

        console.log(
          `Successfully completed milestones. UIDs:`,
          completeResult.uids
        );

        // 5. (Optional) Demonstrate milestone revocation
        console.log(
          "Demonstrating milestone revocation using improved method..."
        );

        console.log(`Milestone UIDs to revoke: ${JSON.stringify(uids)}`);

        // Get the milestone schema
        const milestoneSchema = gap.findSchema("Milestone");
        console.log(`Milestone schema UID: ${milestoneSchema.uid}`);

        // Prepare the revocation arguments
        const revocationArgs: MultiRevokeArgs[] = uids.map((uid) => ({
          schemaId: milestoneSchema.uid,
          uid,
        }));

        // Use the improved revokeMultipleAttestations method
        const revokeResult = await milestone.revokeMultipleAttestations(
          signer,
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

    console.log("All milestone operations completed!");
  } catch (error) {
    console.error("Error in workflow:", error);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
