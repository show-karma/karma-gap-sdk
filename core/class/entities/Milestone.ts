import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { GAP } from "../GAP";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { toUnix } from "../../utils/to-unix";
import { IMilestoneCompleted, MilestoneCompleted } from "../types/attestations";

export interface IMilestone {
  title: string;
  endsAt: number;
  description: string;
}
export class Milestone extends Attestation<IMilestone> implements IMilestone {
  title: string;
  endsAt: number;
  description: string;
  completed: MilestoneCompleted;
  approved: MilestoneCompleted;
  rejected: MilestoneCompleted;

  /**
   * Approves this milestone. If the milestone is not completed or already approved,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async approve(signer: SignerOrProvider, reason = "") {
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");
    if (this.approved)
      throw new AttestationError(
        "ATTEST_ERROR",
        "Milestone is already approved"
      );

    const schema = GapSchema.find("MilestoneCompleted");
    schema.setValue("type", "approved");
    schema.setValue("reason", reason);

    await this.attestStatus(signer, schema);

    this.approved = new MilestoneCompleted({
      data: {
        type: "approved",
        reason,
      },
      refUID: this.uid,
      schema: schema,
      recipient: this.recipient,
    });
  }

  /**
   * Revokes the approved status of the milestone. If the milestone is not approved,
   * it will throw an error.
   * @param signer
   */
  async revokeApproval(signer: SignerOrProvider) {
    if (!this.approved)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not approved");

    await this.approved.revoke(signer);
  }

  /**
   * Reject a completed milestone. If the milestone is not completed or already rejected,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async reject(signer: SignerOrProvider, reason = "") {
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");
    if (this.rejected)
      throw new AttestationError(
        "ATTEST_ERROR",
        "Milestone is already rejected"
      );

    const schema = GapSchema.find("MilestoneCompleted");
    schema.setValue("type", "rejected");
    schema.setValue("reason", reason);
    await this.attestStatus(signer, schema);

    this.rejected = new MilestoneCompleted({
      data: {
        type: "rejected",
        reason,
      },
      refUID: this.uid,
      schema: schema,
      recipient: this.recipient,
    });
  }

  /**
   * Revokes the rejected status of the milestone. If the milestone is not rejected,
   * it will throw an error.
   * @param signer
   */
  async revokeRejection(signer: SignerOrProvider) {
    if (!this.rejected)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not rejected");

    await this.rejected.revoke(signer);
  }

  /**
   * Marks a milestone as completed. If the milestone is already completed,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async complete(signer: SignerOrProvider, reason = "") {
    if (this.completed)
      throw new AttestationError(
        "ATTEST_ERROR",
        "Milestone is already completed"
      );

    const schema = GapSchema.find("MilestoneCompleted");
    schema.setValue("type", "completed");
    schema.setValue("reason", reason);

    await this.attestStatus(signer, schema);
    this.completed = new MilestoneCompleted({
      data: {
        type: "completed",
        reason,
      },
      refUID: this.uid,
      schema,
      recipient: this.recipient,
    });
  }

  /**
   * Revokes the completed status of the milestone. If the milestone is not completed,
   * it will throw an error.
   * @param signer
   */
  async revokeCompletion(signer: SignerOrProvider) {
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");

    await this.completed.revoke(signer);
  }

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(signer: SignerOrProvider, schema: GapSchema) {
    const eas = GAP.eas.connect(signer);
    try {
      const tx = await eas.attest({
        schema: schema.uid,
        data: {
          recipient: this.recipient,
          data: schema.encode(),
          refUID: this.uid,
          expirationTime: 0n,
          revocable: schema.revocable,
        },
      });

      const uid = await tx.wait();
      console.log(uid);
    } catch (error: any) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }
}
