import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../../core/consts";

export interface _IGrantUpdate extends GrantUpdate {}
export interface IGrantUpdate {
  title: string;
  text: string;
  type?: string;
}

type IStatus = "verified";

export interface IGrantUpdateStatus {
  type: `grant-update-${IStatus}`;
  reason?: string;
}

export class GrantUpdateStatus
  extends Attestation<IGrantUpdateStatus>
  implements IGrantUpdateStatus
{
  type: `grant-update-${IStatus}`;
  reason?: string;
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
    } catch (error: any) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }

  /**
   * Verify this GrantUpdate. If the GrantUpdate is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(signer: SignerOrProvider, reason = "", callback?: Function) {
    console.log("Verifying");

    const schema = this.schema.gap.findSchema("GrantUpdateStatus");
    schema.setValue("type", "grant-update-verified");
    schema.setValue("reason", reason);

    console.log("Before attest grant update verified");
    await this.attestStatus(signer, schema, callback);
    console.log("After attest grant update verified");

    this.verified.push(
      new GrantUpdateStatus({
        data: {
          type: "grant-update-verified",
          reason,
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
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
