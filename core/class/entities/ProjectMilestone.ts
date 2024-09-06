import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation, AttestationArgs } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../../core/consts";
import { Transaction } from "ethers";
import { Hex, IProjectMilestoneResponse } from "../karma-indexer/api/types";
import {
  AttestationWithTx,
  IMilestoneCompleted as IProjectMilestoneCompleted,
  MilestoneCompleted as ProjectMilestoneCompleted,
} from "../types/attestations";

export interface IProjectMilestone {
  title: string;
  text: string;
  type?: string;
}

type IStatus = "verified" | "completed";

export interface IProjectMilestoneStatus {
  type?: `project-milestone-${IStatus}`;
  proofOfWork?: string;
  reason?: string;
}

export class ProjectMilestoneStatus
  extends Attestation<IProjectMilestoneStatus>
  implements IProjectMilestoneStatus
{
  type: `project-milestone-${IStatus}`;
  reason?: string;
}

export class ProjectMilestone
  extends Attestation<IProjectMilestone>
  implements IProjectMilestone
{
  title: string;
  text: string;
  verified: ProjectMilestoneStatus[] = [];
  completed: ProjectMilestoneCompleted;

  constructor(data: AttestationArgs<IProjectMilestone, GapSchema>) {
    (data.data as any).type = "project-milestone";
    super(data);
  }

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
    data?: IProjectMilestoneStatus,
    callback?: Function
  ) {
    console.log("Verifying");

    const schema = this.schema.gap.findSchema("ProjectMilestoneStatus");
    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "verified",
          reason: data?.reason || "",
        })
      );
    } else {
      schema.setValue("type", "project-milestone-verified");
      schema.setValue("reason", data?.reason || "");
    }
    console.log("Before attest project milestone verified");
    await this.attestStatus(signer, schema, callback);
    console.log("After attest project milestone verified");

    this.verified.push(
      new ProjectMilestoneStatus({
        data: {
          type: "project-milestone-verified",
          reason: data?.reason || "",
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
  }

  /**
   * Marks a milestone as completed. If the milestone is already completed,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async complete(
    signer: SignerOrProvider,
    data?: IProjectMilestoneStatus,
    callback?: Function
  ) {
    console.log("Completing");

    const schema = this.schema.gap.findSchema("ProjectMilestoneStatus");
    if (this.schema.isJsonSchema()) {
      schema.setValue(
        "json",
        JSON.stringify({
          type: "project-milestone-completed",
          ...data,
        })
      );
    } else {
      schema.setValue("type", "project-milestone-completed");
      schema.setValue("proofOfWork", data?.proofOfWork || "");
      schema.setValue("reason", data?.reason || "");
    }
    console.log("Before attest project milestone completed");
    const { tx, uids } = await this.attestStatus(signer, schema, callback);
    console.log("After attest project milestone completed");

    this.completed = new ProjectMilestoneCompleted({
      data: {
        reason: data?.reason || "",
      },
      refUID: this.uid,
      schema: schema,
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

  static from(
    attestations: IProjectMilestoneResponse[],
    network: TNetwork
  ): ProjectMilestone[] {
    return attestations.map((attestation) => {
      const projectMilestone = new ProjectMilestone({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "ProjectMilestone",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.verified?.length > 0) {
        projectMilestone.verified = attestation.verified.map(
          (m) =>
            new ProjectMilestoneStatus({
              ...m,
              data: {
                ...m.data,
                type:
                  m.data.type === "completed"
                    ? "project-milestone-completed"
                    : "project-milestone-verified",
              },
              schema: new AllGapSchemas().findSchema(
                "ProjectMilestoneStatus",
                chainIdToNetwork[attestation.chainID] as TNetwork
              ),
              chainID: attestation.chainID,
            })
        );
      }

      if (attestation.completed) {
        projectMilestone.completed = new ProjectMilestoneCompleted({
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

      return projectMilestone;
    });
  }
}
