import { Attestation } from '../Attestation';
import {
  GrantDetails,
  GrantRound,
  GrantCompleted,
} from '../types/attestations';
import { IMilestone, Milestone } from './Milestone';
import { GapSchema } from '../GapSchema';
import { GAP } from '../GAP';
import { AttestationError } from '../SchemaError';
import { chainIdToNetwork, nullRef } from '../../consts';
import {
  Hex,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from 'core/types';
import { GapContract } from '../contract/GapContract';
import { Community } from './Community';
import { Project } from './Project';
import { AllGapSchemas } from '../AllGapSchemas';
import { IGrantResponse } from '../karma-indexer/api/types';
import { GrantUpdate, IGrantUpdate, _IGrantUpdate } from './GrantUpdate';

interface _Grant extends Grant {}

export interface IGrant {
  communityUID: Hex;
}

export interface ISummaryProject {
  title: string;
  slug?: string;
  uid: Hex;
}

export class Grant extends Attestation<IGrant> {
  details?: GrantDetails;
  communityUID: Hex;
  verified?: boolean = false;
  round?: GrantRound;
  milestones: Milestone[] = [];
  community: Community;
  updates: GrantUpdate[] = [];
  members: string[] = [];
  completed?: GrantCompleted;
  project?: ISummaryProject;
  categories?: string[] = [];

  async verify(signer: SignerOrProvider) {
    const eas = this.schema.gap.eas.connect(signer);
    const schema = this.schema.gap.findSchema('MilestoneApproved');
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
    const schema = this.schema.gap.findSchema('Milestone');

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
  async multiAttestPayload(
    currentPayload: MultiAttestPayload = [],
    projectIdx = 0
  ) {
    this.assertPayload();
    const payload = [...currentPayload];
    const grantIdx =
      payload.push([this, await this.payloadFor(projectIdx)]) - 1;
    if (this.details) {
      payload.push([this.details, await this.details.payloadFor(grantIdx)]);
    }

    if (this.milestones.length) {
      await Promise.all(
        this.milestones.map(async (m) =>
          payload.push(
            ...(await m.multiAttestPayload(payload, grantIdx))
          )
        )
      );
    }
    if (this.updates.length) {
      await Promise.all(
        this.updates.map(async (u) =>
          payload.push([u, await u.payloadFor(grantIdx)])
        )
      );
    }

    return payload.slice(currentPayload.length, payload.length);
  }

  async attestProject(
    signer: SignerOrProvider,
    originalProjectChainId: number
  ) {
    const project = new Project({
      data: { project: true },
      schema: this.schema.gap.findSchema('Project'),
      recipient: this.recipient,
      chainID: this.chainID,
    });

    (project.details as Attestation) = new Attestation({
      data: {
        originalProjectChainId,
        uid: this.refUID,
      },
      chainID: this.chainID,
      recipient: this.recipient,
      schema: this.schema.gap.findSchema('ProjectDetails'),
    });

    // Overwrite refuid
    Object.assign(this, { refUID: nullRef });
    project.grants = [this];

    await project.attest(signer);
  }

  /**
   * @inheritdoc
   */
  async attest(
    signer: SignerOrProvider,
    projectChainId: number,
    callback?: Function
  ): Promise<void> {
    if (projectChainId !== this.chainID) {
      return this.attestProject(signer, projectChainId);
    }
    this.assertPayload();
    const payload = await this.multiAttestPayload();

    const uids = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1]),
      callback
    );

    uids.forEach((uid, index) => {
      payload[index][0].uid = uid;
    });

    console.log(uids);
  }

  async attestUpdate(signer: SignerOrProvider, data: IGrantUpdate, callback?: Function) {
    const grantUpdate = new GrantUpdate({
      data: {
        ...data,
        type: 'grant-update',
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema('GrantDetails'),
    });

    await grantUpdate.attest(signer, callback);
    this.updates.push(grantUpdate);
  }

  async complete(signer: SignerOrProvider, data: IGrantUpdate, callback?: Function) {
    const completed = new GrantCompleted({
      data: {
        ...data,
        type: 'grant-completed',
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema('GrantDetails'),
    });

    await completed.attest(signer, callback);
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

  static from(attestations: IGrantResponse[], network: TNetwork): Grant[] {
    return attestations.map((attestation) => {
      const grant = new Grant({
        ...attestation,
        data: {
          communityUID: attestation.data.communityUID,
        },
        schema: new AllGapSchemas().findSchema('Grant', chainIdToNetwork[attestation.chainID] as TNetwork),
        chainID: attestation.chainID,
      });

      if (attestation.details) {
        const { details } = attestation;
        grant.details = new GrantDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: new AllGapSchemas().findSchema('GrantDetails', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });
      }

      if (attestation.milestones) {
        const { milestones } = attestation;
        grant.milestones = Milestone.from(milestones, network);
      }

      if (attestation.updates) {
        const { updates } = attestation;
        grant.updates = GrantUpdate.from((updates as any) as _IGrantUpdate[], network);
      }

      if (attestation.completed) {
        const { completed } = attestation;
        grant.completed = new GrantCompleted({
          ...completed,
          data: {
            ...completed.data,
          },
          schema: new AllGapSchemas().findSchema('GrantDetails', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });
      }

      if (attestation.project) {
        const { project } = attestation;
        grant.project = project;
      }

      if (attestation.community) {
        const { community } = attestation;
        grant.community = Community.from([community], network)[0];
      }

      if (attestation.members) {
        grant.members = attestation.members;
      }

      if (attestation.categories) {
        grant.categories = attestation.categories;
      }

      return grant;
    });
  }
}
