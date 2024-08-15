import { Hex, SignerOrProvider, TNetwork } from "../../types";
import { Attestation, AttestationArgs } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../consts";
import { Transaction } from "ethers";

export interface _IProjectImpact extends ProjectImpact {}

type IStatus = "verified";

export interface IProjectImpactStatus {
  type: `project-impact-${IStatus}`;
  reason?: string;
}

export class ProjectImpactStatus
  extends Attestation<IProjectImpactStatus>
  implements IProjectImpactStatus
{
  type: `project-impact-${IStatus}`;
  reason?: string;
}

export interface IProjectImpact {
  work: string;
  impact: string;
  proof: string;
  startedAt?: number;
  completedAt: number;
  type?: string;
  verified: ProjectImpactStatus[];
}

export class ProjectImpact
  extends Attestation<IProjectImpact>
  implements IProjectImpact
{
  work: string;
  impact: string;
  proof: string;
  startedAt?: number;
  completedAt: number;
  type?: string;
  verified: ProjectImpactStatus[] = [];

  constructor(data: AttestationArgs<IProjectImpact, GapSchema>) {
    (data.data as any).type = "project-impact";
    super(data);
  }

  /**
   * Attest Project Impact.
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
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }

  /**
   * Verify this ProjectImpact. If the ProjectImpact is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(signer: SignerOrProvider, reason = "", callback?: Function) {
    console.log("Verifying ProjectImpact");

    const schema = this.schema.gap.findSchema("GrantUpdateStatus");
    schema.setValue("type", "project-impact-verified");
    schema.setValue("reason", reason);

    console.log("Before attest project impact verified");
    const { tx, uids } = await this.attestStatus(signer, schema, callback);
    console.log("After attest project impact verified");

    this.verified.push(
      new ProjectImpactStatus({
        data: {
          type: "project-impact-verified",
          reason,
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );

    return { tx, uids };
  }

  static from(
    attestations: ProjectImpact[],
    network: TNetwork
  ): ProjectImpact[] {
    return attestations.map((attestation) => {
      const projectImpact = new ProjectImpact({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "ProjectImpact",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.verified?.length > 0) {
        projectImpact.verified = attestation.verified.map(
          (m) =>
            new ProjectImpactStatus({
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

      return projectImpact;
    });
  }
}
