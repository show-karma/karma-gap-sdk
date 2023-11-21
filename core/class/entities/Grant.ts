import { Attestation } from '../Attestation';
import {
  GrantDetails,
  GrantRound,
  GrantUpdate,
  IGrantUpdate,
  GrantCompleted,
} from '../types/attestations';
import { IMilestone, Milestone } from './Milestone';
import { GapSchema } from '../GapSchema';
import { GAP } from '../GAP';
import { AttestationError } from '../SchemaError';
import { nullRef } from '../../consts';
import { Hex, MultiAttestPayload, SignerOrProvider } from 'core/types';
import { GapContract } from '../contract/GapContract';
import { Community } from './Community';
import { Project } from './Project';

interface _Grant extends Grant {}

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
  completed?: GrantCompleted;
  project?: Project;

  async verify(signer: SignerOrProvider) {
    const eas = GAP.eas.connect(signer);
    const schema = GapSchema.find('MilestoneApproved');
    schema.setValue('approved', true);

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
      throw new AttestationError('ATTEST_ERROR', error.message);
    }
  }

  /**
   * Add milestones to the grant.
   * @param signer
   * @param milestones
   */
  addMilestones(milestones: IMilestone[]) {
    const schema = GapSchema.find('Milestone');

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
  async multiAttestPayload(currentPayload: MultiAttestPayload = [], projectIdx = 0) {
    this.assertPayload();
    const payload = [...currentPayload];
    const grantIdx = payload.push([this, await this.payloadFor(projectIdx)]) - 1;
    if (this.details) {
      payload.push([this.details, await this.details.payloadFor(grantIdx)]);
    }

    if (this.milestones.length) {
      await Promise.all(
        this.milestones.map(async (m) =>  payload.push([m, await m.payloadFor(grantIdx)]))
      );
    }
    if (this.updates.length) {
      await Promise.all(
        this.updates.map(async (u) =>  payload.push([u, await u.payloadFor(grantIdx)]))
      );
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

  async attestUpdate(signer: SignerOrProvider, data: IGrantUpdate) {
    const grantUpdate = new GrantUpdate({
      data: {
        ...data,
        type: 'grant-update',
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: GapSchema.find('GrantDetails'),
    });

    await grantUpdate.attest(signer);
    this.updates.push(grantUpdate);
  }

  async complete(signer: SignerOrProvider, data: IGrantUpdate) {
    const completed = new GrantCompleted({
      data: {
        ...data,
        type: 'grant-completed',
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: GapSchema.find('GrantDetails'),
    });

    await completed.attest(signer);
    this.completed = completed;
  }

  /**
   * Validate if the grant has a valid reference to a community.
   */
  protected assertPayload() {
    if (!this.details || !this.communityUID) {
      throw new AttestationError(
        'INVALID_REFERENCE',
        'Grant should include a valid reference to a community on its details.'
      );
    }
    return true;
  }

  static from(attestations: _Grant[]): Grant[] {
    return attestations.map((attestation) => {
      const grant = new Grant({
        ...attestation,
        data: {
          communityUID: attestation.data.communityUID,
        },
        schema: GapSchema.find('Grant'),
      });

      if (attestation.details) {
        const { details } = attestation;
        grant.details = new GrantDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: GapSchema.find('GrantDetails'),
        });
      }

      if (attestation.milestones) {
        const { milestones } = attestation;
        grant.milestones = Milestone.from(milestones);
      }

      if (attestation.updates) {
        const { updates } = attestation;
        grant.updates = updates.map(
          (u) =>
            new GrantUpdate({
              ...u,
              data: {
                ...u.data,
              },
              schema: GapSchema.find('GrantDetails'),
            })
        );
      }

      if(attestation.completed) {
        const { completed } = attestation;
        grant.completed = new GrantCompleted({
          ...completed,
          data: {
            ...completed.data,
          },
          schema: GapSchema.find('GrantDetails'),
        });
      }

      if (attestation.project) {
        const { project } = attestation;
        grant.project = Project.from([project])[0];
      }

      if (attestation.community) {
        const { community } = attestation;
        grant.community = Community.from([community])[0];
      }

      return grant;
    });
  }
}
