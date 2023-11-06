import { AttestationRequest } from '@ethereum-attestation-service/eas-sdk';
import { Hex, SignerOrProvider } from '../../types';
import { Attestation } from '../Attestation';
import { GAP } from '../GAP';
import { GapSchema } from '../GapSchema';
import { AttestationError } from '../SchemaError';
import { EasContract } from '../contract/EasContract';
import { MilestoneCompleted } from '../types/attestations';

interface _Milestone extends Milestone {}

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
  async approve(signer: SignerOrProvider, reason = '') {
    if (!this.completed)
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not completed');

    const schema = GapSchema.find('MilestoneCompleted');
    schema.setValue('type', 'approved');
    schema.setValue('reason', reason);

    await this.attestStatus(signer, schema);

    this.approved = new MilestoneCompleted({
      data: {
        type: 'approved',
        reason,
      },
      refUID: this.uid,
      schema: schema,
      recipient: this.recipient,
    });
  }

  /**
   * Revokes by signature (if sponsored txn is enabled)
   * @param signer
   * @returns
   */
  private revokeBySig(signer: SignerOrProvider, uid: Hex, schema: Hex) {
    return EasContract.revokeBySig(signer, {
      data: {
        uid,
        value: 0n,
      },
      schema,
    });
  }

  private attestBySig(signer: SignerOrProvider, payload: AttestationRequest) {
    return EasContract.attestBySig(signer, payload);
  }

  /**
   * Revokes the approved status of the milestone. If the milestone is not approved,
   * it will throw an error.
   * @param signer
   */
  async revokeApproval(signer: SignerOrProvider) {
    if (!this.approved)
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not approved');

    if (GAP.gelatoOpts?.useGasless) {
      return this.revokeBySig(
        signer,
        this.approved.uid,
        this.approved.schema.uid
      );
    }

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
  async reject(signer: SignerOrProvider, reason = '') {
    if (!this.completed)
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not completed');

    const schema = GapSchema.find('MilestoneCompleted');
    schema.setValue('type', 'rejected');
    schema.setValue('reason', reason);
    await this.attestStatus(signer, schema);

    this.rejected = new MilestoneCompleted({
      data: {
        type: 'rejected',
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
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not rejected');

    if (GAP.gelatoOpts?.useGasless) {
      return this.revokeBySig(
        signer,
        this.rejected.uid,
        this.rejected.schema.uid
      );
    }

    await this.rejected.schema.multiRevoke(signer, [
      {
        schemaId: this.completed.schema.uid,
        uid: this.completed.uid,
      },
    ]);
  }

  /**
   * Marks a milestone as completed. If the milestone is already completed,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async complete(signer: SignerOrProvider, reason = '') {
    const schema = GapSchema.find('MilestoneCompleted');
    schema.setValue('type', 'completed');
    schema.setValue('reason', reason);

    await this.attestStatus(signer, schema);
    this.completed = new MilestoneCompleted({
      data: {
        type: 'completed',
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
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not completed');

    if (!GAP.gelatoOpts?.useGasless) {
      return this.revokeBySig(
        signer,
        this.completed.uid,
        this.completed.schema.uid
      );
    }

    await this.completed.schema.multiRevoke(signer, [
      {
        schemaId: this.completed.schema.uid,
        uid: this.completed.uid,
      },
    ]);
  }

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(signer: SignerOrProvider, schema: GapSchema) {
    const args: AttestationRequest = {
      schema: schema.uid,
      data: {
        recipient: this.recipient,
        data: schema.encode(),
        refUID: this.uid,
        expirationTime: 0n,
        revocable: schema.revocable || true,
        value: 0n,
      },
    };

    try {
      if (!GAP.gelatoOpts?.useGasless) {
        return this.attestBySig(signer, args);
      }

      const eas = GAP.eas.connect(signer);
      const tx = await eas.attest(args);
      const uid = await tx.wait();
      console.log(uid);
    } catch (error: any) {
      console.error(error);
      throw new AttestationError('ATTEST_ERROR', error.message);
    }
  }

  static from(attestations: _Milestone[]): Milestone[] {
    return attestations.map((attestation) => {
      const milestone = new Milestone({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: GapSchema.find('Milestone'),
      });

      if (attestation.completed) {
        milestone.completed = new MilestoneCompleted({
          ...attestation.completed,
          data: {
            ...attestation.completed.data,
          },
          schema: GapSchema.find('MilestoneCompleted'),
        });
      }

      if (attestation.approved) {
        milestone.approved = new MilestoneCompleted({
          ...attestation.approved,
          data: {
            ...attestation.completed.data,
          },
          schema: GapSchema.find('MilestoneCompleted'),
        });
      }

      if (attestation.rejected) {
        milestone.rejected = new MilestoneCompleted({
          ...attestation.rejected,
          data: {
            ...attestation.completed.data,
          },
          schema: GapSchema.find('MilestoneCompleted'),
        });
      }

      return milestone;
    });
  }
}
