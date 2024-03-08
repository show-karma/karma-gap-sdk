import { MultiAttestPayload, SignerOrProvider, TNetwork } from '../../types';
import { AllGapSchemas } from '../AllGapSchemas';
import { Attestation } from '../Attestation';
import { GAP } from '../GAP';
import { GapSchema } from '../GapSchema';
import { AttestationError } from '../SchemaError';
import { GapContract } from '../contract/GapContract';
import { MilestoneCompleted } from '../types/attestations';

interface _Milestone extends Milestone {}

const chainIdToNetwork = {
  11155420: 'optimism-sepolia',
  42161: 'arbitrum',
  10: 'optimism',
  11155111: 'sepolia'
};

export interface IMilestone {
  title: string;
  endsAt: number;
  description: string;
  type?: string;
}
export class Milestone extends Attestation<IMilestone> implements IMilestone {
  title: string;
  endsAt: number;
  description: string;
  completed: MilestoneCompleted;
  approved: MilestoneCompleted;
  rejected: MilestoneCompleted;
  type = 'milestone'

  /**
   * Approves this milestone. If the milestone is not completed or already approved,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async approve(signer: SignerOrProvider, reason = '') {
    if (!this.completed)
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not completed');

    const schema = this.schema.gap.findSchema('MilestoneCompleted');
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
   * Revokes the approved status of the milestone. If the milestone is not approved,
   * it will throw an error.
   * @param signer
   */
  async revokeApproval(signer: SignerOrProvider) {
    if (!this.approved)
      throw new AttestationError('ATTEST_ERROR', 'Milestone is not approved');

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

    const schema = this.schema.gap.findSchema('MilestoneCompleted');
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
    const schema = this.schema.gap.findSchema('MilestoneCompleted');
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

    await this.completed.schema.multiRevoke(signer, [
      {
        schemaId: this.completed.schema.uid,
        uid: this.completed.uid,
      },
    ]);
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
    return payload.slice(currentPayload.length, payload.length);
  }

  /**
   * @inheritdoc
   */
  async attest(signer: SignerOrProvider): Promise<void> {
    this.assertPayload();
    const payload = await this.multiAttestPayload();

    const uids = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1])
    );

    uids.forEach((uid, index) => {
      payload[index][0].uid = uid;
    });

    console.log(uids);
  }

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(signer: SignerOrProvider, schema: GapSchema) {
    const eas = this.schema.gap.eas.connect(signer);
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
    } catch (error: any) {
      console.error(error);
      throw new AttestationError('ATTEST_ERROR', error.message);
    }
  }

  static from(attestations: _Milestone[], network: TNetwork): Milestone[] {
    return attestations.map((attestation) => {
      const milestone = new Milestone({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema('Milestone', chainIdToNetwork[attestation.chainID] as TNetwork),
        chainID: attestation.chainID,
      });

      if (attestation.completed) {
        milestone.completed = new MilestoneCompleted({
          ...attestation.completed,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema('MilestoneCompleted', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });
      }

      if (attestation.approved) {
        milestone.approved = new MilestoneCompleted({
          ...attestation.approved,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema('MilestoneCompleted', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });
      }

      if (attestation.rejected) {
        milestone.rejected = new MilestoneCompleted({
          ...attestation.rejected,
          data: {
            ...attestation.completed.data,
          },
          schema: new AllGapSchemas().findSchema('MilestoneCompleted', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });
      }

      return milestone;
    });
  }
}
