import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { GrantDetails, GrantRound } from "../types/attestations";
import { IMilestone, Milestone } from "./Milestone";
import { GapSchema } from "../GapSchema";
import { GAP } from "../GAP";
import { AttestationError } from "../SchemaError";
import { nullRef } from "../../consts";

export interface IGrant {
  grant: true;
}
export class Grant extends Attestation<IGrant> {
  details?: GrantDetails;
  verified?: boolean;
  round?: GrantRound;
  milestones: Milestone[] = [];

  async verify(signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    const schema = GapSchema.find("MilestoneApproved");
    schema.setValue("approved", true);

    try {
      await eas.attest({
        schema: schema.raw,
        data: {
          recipient: this.recipient,
          data: schema.encode(),
          refUID: this.uid,
          expirationTime: 0n,
          revocable: schema.revocable,
        },
      });
      this.verified = true;
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }

  /**
   * Add milestones to the grant.
   * @param signer
   * @param milestones
   */
  async addMilestones(signer: SignerOrProvider, milestones: IMilestone[]) {
    const eas = GAP.eas.connect(signer);
    const schema = GapSchema.find("Milestone");

    const newMilestones = milestones.map((milestone) => {
      const m = new Milestone({
        data: milestone,
        refUID: this.uid,
        schema,
        createdAt: Date.now(),
        recipient: this.recipient,
        uid: nullRef,
      });
      return m;
    });

    try {
      const tx = await eas.multiAttest([
        {
          schema: schema.raw,
          data: newMilestones.map((m) => ({
            recipient: m.recipient,
            data: m.schema.encode(),
            refUID: m.refUID,
            expirationTime: 0n,
            revocable: m.schema.revocable,
          })),
        },
      ]);
      const attestations = await tx.wait();

      newMilestones.forEach((m, idx) => {
        Object.assign(m, { uid: attestations[idx] });
      });

      this.milestones.push(...newMilestones);
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }
}
