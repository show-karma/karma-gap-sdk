import { Attestation } from "../Attestation";
import {
  GrantDetails,
  GrantRound,
  GrantUpdate,
  IGrantUpdate,
} from "../types/attestations";
import { IMilestone, Milestone } from "./Milestone";
import { GapSchema } from "../GapSchema";
import { GAP } from "../GAP";
import { AttestationError } from "../SchemaError";
import { nullRef } from "../../consts";
import { Hex, MultiAttestPayload, SignerOrProvider } from "core/types";
import { GapContract } from "../contract/GapContract";
import { Community } from "./Community";

export interface IGrant {
  communityUID: Hex;
}

export class Grant extends Attestation<IGrant> {
  details?: GrantDetails;
  communityUID: Hex;
  verified?: boolean = false;
  round?: GrantRound;
  milestones: Milestone[] = [];
  community: Community;
  updates: GrantUpdate[] = [];

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
  addMilestones(milestones: IMilestone[]) {
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
    this.milestones.push(...newMilestones);
  }

  /**
   * Creates the payload for a multi-attestation.
   *
   * > if Current payload is set, it'll be used as the base payload
   * and the project should refer to an index of the current payload,
   * usually the community position.
   *
   * @param payload
   * @param projectIdx
   */
  multiAttestPayload(currentPayload: MultiAttestPayload = [], projectIdx = 0) {
    this.assertPayload();
    const payload = [...currentPayload];
    const grantIdx = payload.push([this, this.payloadFor(projectIdx)]) - 1;
    if (this.details) {
      payload.push([this.details, this.details.payloadFor(grantIdx)]);
    }

    if (this.milestones.length) {
      this.milestones.forEach((m) => {
        payload.push([m, m.payloadFor(grantIdx)]);
      });
    }
    return payload.slice(currentPayload.length, payload.length);
  }

  /**
   * @inheritdoc
   */
  async attest(signer: SignerOrProvider): Promise<void> {
    this.assertPayload();
    const payload = this.multiAttestPayload();

    const uids = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1])
    );

    uids.forEach((uid, index) => {
      payload[index][0].uid = uid;
    });

    console.log(uids);
  }

  async attestUpdate(signer: SignerOrProvider, data: IGrantUpdate) {
    const grantUpdate = new GrantUpdate({
      data: {
        ...data,
        type: "grant-update",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: GapSchema.find("GrantDetails"),
    });

    await grantUpdate.attest(signer);
    this.updates.push(grantUpdate);
  }

  /**
   * Validate if the grant has a valid reference to a community.
   */
  protected assertPayload() {
    if (!this.details || !this.communityUID) {
      throw new AttestationError(
        "INVALID_REFERENCE",
        "Grant should include a valid reference to a community on its details."
      );
    }
    return true;
  }
}
