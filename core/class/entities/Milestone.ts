import { Transaction } from "ethers";
import { chainIdToNetwork } from "../../consts";
import {
  Hex,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from "../../types";
import { AllGapSchemas } from "../AllGapSchemas";
import { Attestation } from "../Attestation";
import { GAP } from "../GAP";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { GapContract } from "../contract/GapContract";
import { IMilestoneResponse } from "../karma-indexer/api/types";
import {
  AttestationWithTx,
  MilestoneCompleted,
  IMilestoneCompleted,
} from "../types/attestations";

interface _Milestone extends Milestone {}

export interface IMilestone {
  title: string;
  startsAt?: number;
  endsAt: number;
  description: string;
  type?: string;
}
export class Milestone extends Attestation<IMilestone> implements IMilestone {
  title: string;
  startsAt?: number;
  endsAt: number;
  description: string;
  completed: MilestoneCompleted;
  approved: MilestoneCompleted;
  rejected: MilestoneCompleted;
  verified: MilestoneCompleted[] = [];
  type = "milestone";

  /**
   * Approves this milestone. If the milestone is not completed or already approved,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async approve(
    signer: SignerOrProvider,
    data?: IMilestoneCompleted,
    callback?: Function
  ) {
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");

    const schema = this.schema.gap.findSchema("MilestoneCompleted");
    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "approved",
          reason: data?.reason || "",
        })
      );
    } else {
      schema.setValue("type", "approved");
      schema.setValue("reason", data?.reason || "");
    }
    await this.attestStatus(signer, schema, callback);

    this.approved = new MilestoneCompleted({
      data: {
        type: "approved",
        reason: data?.reason || "",
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

    await this.approved.schema.multiRevoke(signer, [
      {
        schemaId: this.completed.schema.uid,
        uid: this.completed.uid,
      },
    ]);
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

    const schema = this.schema.gap.findSchema("MilestoneCompleted");
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

    const { tx, uids } = await this.rejected.schema.multiRevoke(signer, [
      {
        schemaId: this.completed.schema.uid,
        uid: this.completed.uid,
      },
    ]);
    return { tx, uids };
  }

  /**
   * Marks a milestone as completed. If the milestone is already completed,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async complete(
    signer: SignerOrProvider,
    data?: IMilestoneCompleted,
    callback?: Function
  ): Promise<AttestationWithTx> {
    const schema = this.schema.gap.findSchema("MilestoneCompleted");

    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "completed",
          reason: data?.reason || "",
        })
      );
    } else {
      schema.setValue("type", "completed");
      schema.setValue("reason", data?.reason || "");
    }
    const { tx, uids } = await this.attestStatus(signer, schema, callback);
    this.completed = new MilestoneCompleted({
      data: {
        type: "completed",
        reason: data?.reason || "",
      },
      refUID: this.uid,
      schema,
      recipient: this.recipient,
    });
    return { tx, uids };
  }

  /**
   * Revokes the completed status of the milestone. If the milestone is not completed,
   * it will throw an error.
   * @param signer
   */
  async revokeCompletion(signer: SignerOrProvider, callback?: Function) {
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");

    const { tx, uids } = await this.completed.schema.multiRevoke(
      signer,
      [
        {
          schemaId: this.completed.schema.uid,
          uid: this.completed.uid,
        },
      ],
      callback
    );
    return { tx, uids };
  }

  /**
   * Creates the payload for a multi-attestation.
   *
   * > if Current payload is set, it'll be used as the base payload
   * and the project should refer to an index of the current payload,
   * usually the community position.
   *
   * @param payload
   * @param grantIdx
   */
  async multiAttestPayload(
    currentPayload: MultiAttestPayload = [],
    grantIdx = 0
  ) {
    this.assertPayload();
    const payload = [...currentPayload];
    const milestoneIdx =
      payload.push([this, await this.payloadFor(grantIdx)]) - 1;
    if (this.completed) {
      payload.push([
        this.completed,
        await this.completed.payloadFor(milestoneIdx),
      ]);
    }
    if (this.verified.length > 0) {
      await Promise.all(
        this.verified.map(async (m) => {
          const payloadForMilestone = await m.payloadFor(milestoneIdx);
          if (Array.isArray(payloadForMilestone)) {
            payloadForMilestone.forEach((item) => payload.push(item));
          }
        })
      );
    }
    return payload.slice(currentPayload.length, payload.length);
  }

  /**
   * @inheritdoc
   */
  async attest(
    signer: SignerOrProvider,
    callback?: Function
  ): Promise<AttestationWithTx> {
    this.assertPayload();
    const payload = await this.multiAttestPayload();

    const { uids, tx } = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1]),
      callback
    );
    if (Array.isArray(uids)) {
      uids.forEach((uid, index) => {
        payload[index][0].uid = uid;
      });
    }
    console.log(uids);

    return { tx, uids };
  }

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(
    signer: SignerOrProvider,
    schema: GapSchema,
    callback?: Function
  ): Promise<AttestationWithTx> {
    const eas = this.schema.gap.eas.connect(signer);
    try {
      if (callback) callback("preparing");
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

      if (callback) callback("pending");
      const uid = await tx.wait();
      if (callback) callback("confirmed");
      console.log(uid);

      return {
        tx: [
          {
            hash: tx.tx.hash as Hex,
          } as Transaction,
        ],
        uids: [uid as `0x${string}`],
      };
    } catch (error: any) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message, error);
    }
  }

  static from(
    attestations: IMilestoneResponse[],
    network: TNetwork
  ): Milestone[] {
    return attestations.map((attestation) => {
      const milestone = new Milestone({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "Milestone",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.completed) {
        milestone.completed = new MilestoneCompleted({
          ...attestation.completed,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema(
            "MilestoneCompleted",
            chainIdToNetwork[attestation.chainID] as TNetwork
          ),
          chainID: attestation.chainID,
        });
      }

      if (attestation.approved) {
        milestone.approved = new MilestoneCompleted({
          ...attestation.approved,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema(
            "MilestoneCompleted",
            chainIdToNetwork[attestation.chainID] as TNetwork
          ),
          chainID: attestation.chainID,
        });
      }

      if (attestation.rejected) {
        milestone.rejected = new MilestoneCompleted({
          ...attestation.rejected,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema(
            "MilestoneCompleted",
            chainIdToNetwork[attestation.chainID] as TNetwork
          ),
          chainID: attestation.chainID,
        });
      }

      if (attestation.verified?.length > 0) {
        milestone.verified = attestation.verified.map(
          (m) =>
            new MilestoneCompleted({
              ...m,
              data: {
                ...m.data,
              },
              schema: new AllGapSchemas().findSchema(
                "MilestoneCompleted",
                chainIdToNetwork[attestation.chainID] as TNetwork
              ),
              chainID: attestation.chainID,
            })
        );
      }

      return milestone;
    });
  }

  /**
   * Verify this milestone. If the milestone is not completed or already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(
    signer: SignerOrProvider,
    data?: IMilestoneCompleted,
    callback?: Function
  ): Promise<AttestationWithTx> {
    console.log("Verifying");
    if (!this.completed)
      throw new AttestationError("ATTEST_ERROR", "Milestone is not completed");

    const schema = this.schema.gap.findSchema("MilestoneCompleted");

    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "verified",
          reason: data?.reason || "",
        })
      );
    } else {
      schema.setValue("type", "verified");
      schema.setValue("reason", data?.reason || "");
    }
    console.log("Before attestStatus");
    const { tx, uids } = await this.attestStatus(signer, schema, callback);
    console.log("After attestStatus");

    this.verified.push(
      new MilestoneCompleted({
        data: {
          type: "verified",
          reason: data?.reason || "",
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
    return { tx, uids };
  }
}
