import { Attestation } from '../Attestation';
import {
  Grantee,
  MemberDetails,
  ProjectDetails,
  Tag,
} from '../types/attestations';
import {
  Hex,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from 'core/types';
import { GapSchema } from '../GapSchema';
import { AttestationError } from '../SchemaError';
import { mapFilter } from '../../utils';
import { Grant } from './Grant';
import { nullRef } from '../../consts';
import { MemberOf } from './MemberOf';
import { GapContract } from '../contract/GapContract';
import { AllGapSchemas } from '../AllGapSchemas';

interface _Project extends Project {}

export interface IProject {
  project: true;
}

const chainIdToNetwork = {
  11155420: 'optimism-sepolia',
  42161: 'arbitrum',
  10: 'optimism',
  11155111: 'sepolia'
};

export class Project extends Attestation<IProject> {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[] = [];
  grantee: Grantee;

  /**
   * Creates the payload for a multi-attestation.
   *
   * > if Current payload is set, it'll be used as the base payload
   * and the project should refer to an index of the current payload,
   * usually the community position.
   *
   * @param payload
   * @param communityIdx
   */
  async multiAttestPayload(
    currentPayload: MultiAttestPayload = [],
    communityIdx = 0
  ): Promise<MultiAttestPayload> {
    const payload = [...currentPayload];
    const projectIdx =
      payload.push([this, await this.payloadFor(communityIdx)]) - 1;

    if (this.details) {
      payload.push([this.details, await this.details.payloadFor(projectIdx)]);
    }

    if (this.members?.length) {
      await Promise.all(
        this.members.map(async (m) =>
          payload.push(...(await m.multiAttestPayload(payload, projectIdx)))
        )
      );
    }

    if (this.grants?.length) {
      await Promise.all(
        this.grants.map(async (g) =>
          payload.push(...(await g.multiAttestPayload(payload, projectIdx)))
        )
      );
    }

    return payload.slice(currentPayload.length, payload.length);
  }

  async attest(signer: SignerOrProvider): Promise<void> {
    const payload = await this.multiAttestPayload();
    const uids = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1])
    );

    uids.forEach((uid, index) => {
      payload[index][0].uid = uid;
    });
  }

  async transferOwnership(signer: SignerOrProvider, newOwner: Hex) {
    await GapContract.transferProjectOwnership(signer, this.uid, newOwner);
  }

  isOwner(signer: SignerOrProvider): Promise<boolean> {
    return GapContract.isProjectOwner(signer, this.uid, this.chainID);
  }

  /**
   * Add new members to the project.
   * If any member in the array already exists in the project
   * it'll be ignored.
   * @param members
   */
  pushMembers(...members: Hex[]) {
    this.members.push(
      ...mapFilter(
        members,
        (member) => !!this.members.find((m) => m.recipient === member),
        (member) =>
          new MemberOf({
            data: { memberOf: true },
            refUID: this.uid,
            schema: this.schema.gap.findSchema('MemberOf'),
            recipient: member,
            uid: nullRef,
          })
      )
    );
  }

  /**
   * Add new members to the project.
   * If any member in the array already exists in the project
   * it'll be ignored.
   *
   * __To modify member details, use `addMemberDetails(signer, MemberDetails[])` instead.__
   * @param signer
   * @param members
   */
  async attestMembers(signer: SignerOrProvider, members: MemberDetails[]) {
    const newMembers = mapFilter(
      members,
      (member) => !this.members.find((m) => m.recipient === member.recipient),
      // (member) => !!member,
      (details) => {
        const member = new MemberOf({
          data: { memberOf: true },
          refUID: this.uid,
          schema: this.schema.gap.findSchema('MemberOf'),
          createdAt: Date.now(),
          recipient: details.recipient,
          uid: nullRef,
        });
        return { member, details };
      }
    );

    if (!newMembers.length) {
      throw new AttestationError('ATTEST_ERROR', 'No new members to add.');
    }

    console.log(`Creating ${newMembers.length} new members`);

    const attestedMembers = <Hex[]>await this.schema.multiAttest(
      signer,
      newMembers.map((m) => m.member)
    );

    console.log('attested-members', attestedMembers);

    newMembers.forEach(({ member, details }, idx) => {
      Object.assign(member, { uid: attestedMembers[idx] });

      if (!details) return;
      Object.assign(details, { refUID: attestedMembers[idx] });
    });

    this.members.push(...newMembers.map((m) => m.member));

    await this.addMemberDetails(
      signer,
      newMembers.map((m) => m.details)
    );
  }

  /**
   * Add new details to the members of a project. Note that it will overwrite
   * any existing details.
   *
   * @param signer
   * @param entities
   */
  private async addMemberDetails(
    signer: SignerOrProvider,
    entities: MemberDetails[]
  ) {
    // Check if any of members should be revoked (details modified)
    const toRevoke = mapFilter(
      this.members,
      (member) =>
        !!entities.find(
          (entity) =>
            member.uid === entity.refUID &&
            member.details &&
            member.details?.refUID !== entity.refUID
        ),
      (member) => member.uid
    );

    if (toRevoke.length) {
      console.log('Revoking details');
      await this.cleanDetails(signer, toRevoke);
    }

    console.log(`Creating ${entities.length} new member details`);

    const attestedEntities = <Hex[]>(
      await this.schema.multiAttest(signer, entities)
    );
    console.log('attested-entities', attestedEntities);

    entities.forEach((entity, idx) => {
      const member = this.members.find(
        (member) => member.uid === entity.refUID
      );
      if (!member) return;

      Object.assign(entity, { uid: attestedEntities[idx] });
      member.details = entity;
    });
  }

  /**
   * Clean member details.
   * @param signer
   * @param uids
   */
  async cleanDetails(signer: SignerOrProvider, uids: Hex[]) {
    if (!uids.length) {
      throw new AttestationError('ATTEST_ERROR', 'No details to clean.');
    }
    const memberDetails = this.schema.gap.findSchema('MemberDetails');

    await this.schema.multiRevoke(
      signer,
      uids.map((uid) => ({ schemaId: memberDetails.uid, uid }))
    );

    this.members.forEach((member) => {
      if (!member.details) return;
      if (uids.includes(member.details.uid)) {
        member.details = undefined;
      }
    });
  }

  /**
   * Remove members from the project.
   * @param signer
   * @param uids
   * @returns
   */
  async removeMembers(signer: SignerOrProvider, uids: Hex[]) {
    if (!uids.length) {
      throw new AttestationError('ATTEST_ERROR', 'No members to remove.');
    }
    const memberOf = this.schema.gap.findSchema('MemberOf');

    const details = mapFilter(
      this.members,
      (m) => uids.includes(m.uid) && !!m.details,
      (m) => m.details?.uid
    );

    if (details.length) {
      await this.cleanDetails(signer, details);
    }

    await this.schema.multiRevoke(
      signer,
      uids.map((uid) => ({ schemaId: memberOf.uid, uid }))
    );

    this.members = this.members.filter((m) => !uids.includes(m.uid));
  }

  /**
   * Remove all members from the project.
   * @param signer
   */
  async removeAllMembers(signer: SignerOrProvider) {
    const members = mapFilter(
      this.members,
      (m) => !!m.uid,
      (m) => m.uid
    );

    if (!members.length) {
      throw new AttestationError('REVOKATION_ERROR', 'No members to revoke.');
    }

    const details = mapFilter(
      this.members,
      (m) => !!m.details,
      (m) => m.details?.uid
    );
    if (details.length) {
      await this.cleanDetails(signer, details);
    }

    await this.removeMembers(signer, members);
    this.members.splice(0, this.members.length);
  }



  static from(attestations: _Project[], network: TNetwork): Project[] {
    return attestations.map((attestation) => {
      const project = new Project({
        ...attestation,
        data: {
          project: true,
        },
        schema: new AllGapSchemas().findSchema('Project', chainIdToNetwork[attestation.chainID] as TNetwork),
        chainID: attestation.chainID,
      });

      if (attestation.details) {
        const { details } = attestation;
        project.details = new ProjectDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: new AllGapSchemas().findSchema('ProjectDetails', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        });

        project.details.links = details.data.links || [];
        project.details.tags = details.data.tags || [];

        if ((attestation.data as any).links) {
          project.details.links = (attestation.data as any).links;
        }

        if ((attestation.data as any).tags) {
          project.details.tags = (attestation as any).tags;
        }
      }

      if (attestation.members) {
        project.members = attestation.members.map((m) => {
          const member = new MemberOf({
            ...m,
            data: {
              memberOf: true,
            },
            schema: new AllGapSchemas().findSchema('MemberOf', chainIdToNetwork[attestation.chainID] as TNetwork),
            chainID: attestation.chainID,
          });

          if (m.details) {
            const { details } = m;
            member.details = new MemberDetails({
              ...details,
              data: {
                ...details.data,
              },
              schema: new AllGapSchemas().findSchema('MemberDetails', chainIdToNetwork[attestation.chainID] as TNetwork),
              chainID: attestation.chainID,
            });
          }

          return member;
        });
      }

      if (attestation.grants) {
        project.grants = Grant.from(attestation.grants, network);
      }

      return project;
    });
  }
}
