/**
 * Example script demonstrating how to attest a milestone to multiple grants in a single transaction.
 */
import { GAP } from "../class/GAP";
import { Milestone } from "../class/entities/Milestone";
import { Grant } from "../class/entities/Grant";
import { Hex, SignerOrProvider } from "../types";
import { GapContract } from "../class/contract/GapContract";
import { MultiAttestPayload } from "../types";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  // Initialize GAP with your network and signer
  // Replace with your actual RPC URL and private key
  const signer = privateKeyToAccount("0xprivate-key");
  const gap = new GAP({
    network: "optimism",
    // Additional GAP options can be specified here if needed
  });

  try {
    console.log("Attesting milestone to multiple grants example");

    // Example: Retrieve existing grants
    // Replace these with actual grant UIDs from your application
    // Using TypeScript template literals to ensure proper Hex type matching
    const grantUIDs: Hex[] = ["0x123" as Hex, "0x456" as Hex, "0x789" as Hex];

    // Fetch grants using individual queries instead of fetchByUID
    const grants = await Promise.all(
      grantUIDs.map(async (uid) => {
        return await gap.fetch.attestation<Grant>(uid);
      })
    );

    console.log(`Retrieved ${grants.length} grants`);

    // Create a new milestone
    const milestone = new Milestone({
      schema: gap.findSchema("Milestone"),
      recipient: signer.address,
      data: {
        title: "Cross-Grant Milestone",
        description: "This milestone applies to multiple grants",
        endsAt: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
        priority: 1,
      },
    });

    console.log("Created milestone object");

    // Function to attest a milestone directly to specific grant UIDs
    async function attestMilestoneToSpecificGrants(
      milestoneObj: Milestone,
      grantIds: Hex[],
      signerObj: SignerOrProvider
    ) {
      // Create a payload for each grant
      const allPayloads: any[] = [];

      // For each grant UID, create a milestone attestation with that grant as the reference
      for (const grantUID of grantIds) {
        // Create a new milestone that references this specific grant
        const grantMilestone = new Milestone({
          schema: milestoneObj.schema,
          recipient: milestoneObj.recipient,
          data: milestoneObj.data,
          refUID: grantUID, // Point directly to this grant's UID
        });

        // Generate the payload for this grant
        const payload = await grantMilestone.multiAttestPayload();
        // Add each item from payload to allPayloads
        payload.forEach((item) => allPayloads.push(item));
      }

      // Execute all attestations in a single transaction
      const { uids, tx } = await GapContract.multiAttest(
        signerObj,
        allPayloads.map((p) => p[1]),
        (status) => console.log(`Attestation status: ${status}`)
      );

      return { uids, tx };
    }

    // Attest the milestone to your specific grant UIDs
    const result = await attestMilestoneToSpecificGrants(
      milestone,
      grantUIDs,
      signer
    );

    console.log("Milestone attested to all grants successfully");
    console.log("UIDs:", result.uids);

    // If you need to complete the milestone for all grants
    if (result.uids.length > 0) {
      // Complete all the newly created milestones at once
      const completionResult = await milestone.approveMultipleGrants(
        signer,
        result.uids, // UIDs of the milestones we just created
        {
          reason: "Milestone completed for all grants",
          proofOfWork: "https://example.com/proof",
        },
        (status) => console.log(`Completion status: ${status}`)
      );

      console.log("Milestones completed for all grants");
      console.log("Completion UIDs:", completionResult.uids);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
