import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../../core/consts";
import { Transaction } from "ethers";
import { Hex } from "../karma-indexer/api/types";

export interface _IGrantUpdate extends GrantUpdate {}
export interface IGrantUpdate {
  title: string;
  text: string;
  type?: string;
}

type IStatus = "verified";

export interface IGrantUpdateStatus {
  type?: `grant-update-${IStatus}`;
  reason?: string;
  proofOfWork?: string;
}

export class GrantUpdateStatus
  extends Attestation<IGrantUpdateStatus>
  implements IGrantUpdateStatus
{
  type: `grant-update-${IStatus}`;
  reason?: string;
  proofOfWork?: string;
}

export class GrantUpdate
  extends Attestation<IGrantUpdate>
  implements IGrantUpdate
{
  title: string;
  text: string;
  verified: GrantUpdateStatus[] = [];

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(
    signer: SignerOrProvider,
    schema: GapSchema,
    callback?: Function
  ) {
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

  /**
   * Verify this GrantUpdate. If the GrantUpdate is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(
    signer: SignerOrProvider,
    data?: IGrantUpdateStatus,
    callback?: Function
  ) {
    console.log("Verifying");

    const schema = this.schema.gap.findSchema("GrantUpdateStatus");

    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "grant-update-verified",
          reason: data?.reason || "",
          proofOfWork: data?.proofOfWork || "",
        })
      );
    } else {
      schema.setValue("type", "grant-update-verified");
      schema.setValue("reason", data?.reason || "");
      schema.setValue("proofOfWork", data?.proofOfWork || "");
    }

    console.log("Before attest grant update verified");
    const { tx, uids } = await this.attestStatus(signer, schema, callback);
    console.log("After attest grant update verified");

    this.verified.push(
      new GrantUpdateStatus({
        data: {
          type: "grant-update-verified",
          reason: data?.reason || "",
          proofOfWork: data?.proofOfWork || "",
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );

    return {
      tx,
      uids,
    };
  }

  static from(attestations: _IGrantUpdate[], network: TNetwork): GrantUpdate[] {
    return attestations.map((attestation) => {
      const grantUpdate = new GrantUpdate({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "GrantUpdate",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.verified?.length > 0) {
        grantUpdate.verified = attestation.verified.map(
          (m) =>
            new GrantUpdateStatus({
              ...m,
              data: {
                ...m.data,
              },
              schema: new AllGapSchemas().findSchema(
                "GrantUpdateStatus",
                chainIdToNetwork[attestation.chainID] as TNetwork
              ),
              chainID: attestation.chainID,
            })
        );
      }

      return grantUpdate;
    });
  }
}
