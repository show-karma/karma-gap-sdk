import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../../core/consts";
import { Transaction } from "ethers";
import { Hex } from "../karma-indexer/api/types";
import { AttestationWithTx } from "../types/attestations";

export interface _IProjectUpdate extends ProjectUpdate {}
export interface IProjectUpdate {
  title: string;
  text: string;
  type?: string;
}

type IStatus = "verified";

export interface IProjectUpdateStatus {
  type?: `project-update-${IStatus}`;
  reason?: string;
  proofOfWork?: string;
}

export class ProjectUpdateStatus
  extends Attestation<IProjectUpdateStatus>
  implements IProjectUpdateStatus
{
  type: `project-update-${IStatus}`;
  reason?: string;
  proofOfWork?: string;
}

export class ProjectUpdate
  extends Attestation<IProjectUpdate>
  implements IProjectUpdate
{
  title: string;
  text: string;
  verified: ProjectUpdateStatus[] = [];

  /**
   * Attest the status of the update as approved, rejected or completed.
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

  /**
   * Verify this ProjectUpdate. If the ProjectUpdate is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(
    signer: SignerOrProvider,
    data?: IProjectUpdateStatus,
    callback?: Function
  ) {
    console.log("Verifying");

    const schema = this.schema.gap.findSchema("ProjectUpdateStatus");
    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "verified",
          reason: data?.reason || "",
        })
      );
    } else {
      schema.setValue("type", "project-update-verified");
      schema.setValue("reason", data?.reason || "");
    }
    console.log("Before attest project update verified");
    await this.attestStatus(signer, schema, callback);
    console.log("After attest project update verified");

    this.verified.push(
      new ProjectUpdateStatus({
        data: {
          type: "project-update-verified",
          reason: data?.reason || "",
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
  }

  static from(
    attestations: _IProjectUpdate[],
    network: TNetwork
  ): ProjectUpdate[] {
    return attestations.map((attestation) => {
      const projectUpdate = new ProjectUpdate({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "ProjectUpdate",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.verified?.length > 0) {
        projectUpdate.verified = attestation.verified.map(
          (m) =>
            new ProjectUpdateStatus({
              ...m,
              data: {
                ...m.data,
              },
              schema: new AllGapSchemas().findSchema(
                "ProjectUpdateStatus",
                chainIdToNetwork[attestation.chainID] as TNetwork
              ),
              chainID: attestation.chainID,
            })
        );
      }

      return projectUpdate;
    });
  }
}
