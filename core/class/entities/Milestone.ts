import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { GAP } from "../GAP";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";

export interface IMilestone {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
}
export class Milestone extends Attestation<IMilestone> implements IMilestone {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
  completed: boolean;
  approved: boolean;

  async approve(signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    const schema = GapSchema.find("MilestoneApproved");
    schema.setValue("isVerified", true);

    if (!this.completed)
      throw new AttestationError(
        "INVALID_DATA",
        "Milestone must be completed before approving"
      );

    try {
      await eas.attest({
        schema: schema.uid,
        data: {
          recipient: this.recipient,
          data: schema.encode(),
          refUID: this.uid,
          expirationTime: 0n,
          revocable: schema.revocable,
        },
      });
      this.approved = true;
    } catch (error: any) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }

  async complete(signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    const schema = GapSchema.find("MilestoneCompleted");
    schema.setValue("isVerified", true);

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
      this.completed = true;
    } catch (error: any) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }
}
