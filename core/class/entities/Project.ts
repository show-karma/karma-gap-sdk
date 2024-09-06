import { Attestation } from "../Attestation";
import {
  AttestationWithTx,
  Grantee,
  MemberDetails,
  ProjectDetails,
  ProjectEndorsement,
  Tag,
} from "../types/attestations";
import {
  Hex,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from "core/types";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { mapFilter } from "../../utils";
import { Grant } from "./Grant";
import { chainIdToNetwork, nullRef } from "../../consts";
import { MemberOf } from "./MemberOf";
import { GapContract } from "../contract/GapContract";
import { AllGapSchemas } from "../AllGapSchemas";
import {
  IProjectMilestoneResponse,
  IProjectResponse,
} from "../karma-indexer/api/types";
import { IProjectImpact, ProjectImpact } from "./ProjectImpact";
import { ProjectUpdate } from "./ProjectUpdate";
import { ProjectPointer } from "./ProjectPointer";
import { ProjectMilestone } from "./ProjectMilestone";

interface _Project extends Project {}

export interface IProject {
  project: true;
}

export class Project extends Attestation<IProject> {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[] = [];
  grantee: Grantee;
  impacts: ProjectImpact[] = [];
  endorsements: ProjectEndorsement[] = [];
  updates: ProjectUpdate[] = [];
  pointers: ProjectPointer[] = [];
  milestones: ProjectMilestone[] = [];

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

  async attest(
    signer: SignerOrProvider,
    callback?: Function
  ): Promise<AttestationWithTx> {
    const payload = await this.multiAttestPayload();
    const { tx, uids } = await GapContract.multiAttest(
      signer,
      payload.map((p) => p[1]),
      callback
    );

    if (Array.isArray(uids)) {
      uids.forEach((uid, index) => {
        payload[index][0].uid = uid;
      });
    }
    return { tx, uids };
  }

  async transferOwnership(
    signer: SignerOrProvider,
    newOwner: Hex,
    callback?: Function
  ): Promise<AttestationWithTx> {
    callback?.("preparing");
    const tx = await GapContract.transferProjectOwnership(
      signer,
      this.uid,
      newOwner
    );
    callback?.("confirmed");
    const txArray = [tx].flat();
    return { tx: txArray, uids: [this.uid] };
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
            schema: this.schema.gap.findSchema("MemberOf"),
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
  async attestMembers(
    signer: SignerOrProvider,
    members: MemberDetails[],
    callback?: Function
  ) {
    const newMembers = mapFilter(
      members,
      (member) => !this.members.find((m) => m.recipient === member.recipient),
      // (member) => !!member,
      (details) => {
        const member = new MemberOf({
          data: { memberOf: true },
          refUID: this.uid,
          schema: this.schema.gap.findSchema("MemberOf"),
          createdAt: Date.now(),
          recipient: details.recipient,
          uid: nullRef,
        });
        return { member, details };
      }
    );

    if (!newMembers.length) {
      throw new AttestationError("ATTEST_ERROR", "No new members to add.");
    }

    console.log(`Creating ${newMembers.length} new members`);

    const { uids: attestedMembers } = await this.schema.multiAttest(
      signer,
      newMembers.map((m) => m.member),
      callback
    );

    console.log("attested-members", attestedMembers);

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
    entities: MemberDetails[],
    callback?: Function
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
      console.log("Revoking details");
      await this.cleanDetails(signer, toRevoke);
    }

    console.log(`Creating ${entities.length} new member details`);

    const { uids: attestedEntities } = await this.schema.multiAttest(
      signer,
      entities,
      callback
    );
    console.log("attested-entities", attestedEntities);

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
      throw new AttestationError("ATTEST_ERROR", "No details to clean.");
    }
    const memberDetails = this.schema.gap.findSchema("MemberDetails");

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
      throw new AttestationError("ATTEST_ERROR", "No members to remove.");
    }
    const memberOf = this.schema.gap.findSchema("MemberOf");

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
      throw new AttestationError("REVOKATION_ERROR", "No members to revoke.");
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

  static from(attestations: IProjectResponse[], network: TNetwork): Project[] {
    return attestations.map((attestation) => {
      const project = new Project({
        ...attestation,
        data: {
          project: true,
        },
        schema: new AllGapSchemas().findSchema(
          "Project",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      if (attestation.details) {
        const { details } = attestation;
        project.details = new ProjectDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: new AllGapSchemas().findSchema(
            "ProjectDetails",
            chainIdToNetwork[attestation.chainID] as TNetwork
          ),
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
            schema: new AllGapSchemas().findSchema(
              "MemberOf",
              chainIdToNetwork[attestation.chainID] as TNetwork
            ),
            chainID: attestation.chainID,
          });

          if (m.details) {
            const { details } = m;
            member.details = new MemberDetails({
              ...details,
              data: {
                ...details.data,
              },
              schema: new AllGapSchemas().findSchema(
                "MemberDetails",
                chainIdToNetwork[attestation.chainID] as TNetwork
              ),
              chainID: attestation.chainID,
            });
          }

          return member;
        });
      }

      if (attestation.grants) {
        project.grants = Grant.from(attestation.grants, network);
      }

      if (attestation.impacts) {
        project.impacts = ProjectImpact.from(
          attestation.impacts as unknown as ProjectImpact[],
          network
        );
      }

      if (attestation.pointers) {
        project.pointers = ProjectPointer.from(
          attestation.pointers as unknown as ProjectPointer[],
          network
        );
      }

      if (attestation.updates) {
        project.updates = ProjectUpdate.from(
          attestation.updates as unknown as ProjectUpdate[],
          network
        );
      }

      if (attestation.milestones) {
        project.milestones = ProjectMilestone.from(
          attestation.milestones as unknown as IProjectMilestoneResponse[],
          network
        );
      }

      if (attestation.endorsements) {
        project.endorsements = attestation.endorsements.map((pi) => {
          const endorsement = new ProjectEndorsement({
            ...pi,
            data: {
              ...pi.data,
            },
            schema: new AllGapSchemas().findSchema(
              "ProjectDetails",
              chainIdToNetwork[attestation.chainID] as TNetwork
            ),
            chainID: attestation.chainID,
          });

          return endorsement;
        });
      }

      return project;
    });
  }

  async attestUpdate(
    signer: SignerOrProvider,
    data: ProjectUpdate,
    callback?: Function
  ) {
    const projectUpdate = new ProjectUpdate({
      data: {
        ...data,
        type: "project-update",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema("ProjectUpdate"),
    });

    await projectUpdate.attest(signer, callback);
    this.updates.push(projectUpdate);
  }

  async attestMilestone(
    signer: SignerOrProvider,
    data: ProjectUpdate,
    callback?: Function
  ) {
    const projectMilestone = new ProjectMilestone({
      data: {
        ...data,
        type: "project-milestone",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema("ProjectMilestone"),
    });

    await projectMilestone.attest(signer, callback);
    this.milestones.push(projectMilestone);
  }

  async attestPointer(
    signer: SignerOrProvider,
    data: ProjectPointer,
    callback?: Function
  ) {
    const projectPointer = new ProjectPointer({
      data: {
        ...data,
        type: "project-pointer",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema("ProjectPointer"),
    });

    await projectPointer.attest(signer, callback);
    this.pointers.push(projectPointer);
  }

  async attestImpact(
    signer: SignerOrProvider,
    data: IProjectImpact,
    targetChainId?: number,
    callback?: Function
  ): Promise<AttestationWithTx> {
    if (targetChainId && targetChainId !== this.chainID) {
      return this.attestGhostProjectImpact(
        signer,
        data,
        targetChainId,
        callback
      );
    }

    const projectImpact = new ProjectImpact({
      data: {
        ...data,
        type: "project-impact",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema("ProjectDetails"),
    });

    const { tx, uids } = await projectImpact.attest(signer, callback);
    this.impacts.push(projectImpact);
    return { tx, uids };
  }

  private async attestGhostProjectImpact(
    signer: SignerOrProvider,
    data: IProjectImpact,
    targetChainId: number,
    callback?: Function
  ): Promise<AttestationWithTx> {
    const { tx, uids } = await this.attestGhostProject(signer, targetChainId);
    const ghostProjectUid = uids[0];

    const allGapSchemas = new AllGapSchemas();
    const projectImpact = new ProjectImpact({
      data: {
        ...data,
        type: "project-impact",
      },
      recipient: this.recipient,
      refUID: ghostProjectUid,
      schema: allGapSchemas.findSchema(
        "ProjectDetails",
        chainIdToNetwork[targetChainId]
      ),
      chainID: targetChainId,
    });

    const impactAttestation = await projectImpact.attest(signer, callback);
    this.impacts.push(projectImpact);

    return {
      tx: impactAttestation.tx,
      uids: [...uids, impactAttestation.uids[0]],
    };
  }

  async attestEndorsement(signer: SignerOrProvider, data?: ProjectEndorsement) {
    const projectEndorsement = new ProjectEndorsement({
      data: {
        ...data,
        type: "project-endorsement",
      },
      recipient: this.recipient,
      refUID: this.uid,
      schema: this.schema.gap.findSchema("ProjectDetails"),
    });

    await projectEndorsement.attest(signer);
    this.endorsements.push(projectEndorsement);
  }

  async attestGhostProject(signer: SignerOrProvider, targetChainId: number) {
    const allGapSchemas = new AllGapSchemas();
    const project = new Project({
      data: { project: true },
      schema: allGapSchemas.findSchema(
        "Project",
        chainIdToNetwork[targetChainId]
      ),
      recipient: this.recipient,
      chainID: targetChainId,
    });

    (project.details as Attestation) = new Attestation({
      data: {
        originalProjectChainId: this.chainID,
        uid: this.uid,
      },
      chainID: targetChainId,
      recipient: this.recipient,
      schema: allGapSchemas.findSchema(
        "ProjectDetails",
        chainIdToNetwork[targetChainId]
      ),
    });

    const attestation = await project.attest(signer);
    return attestation;
  }
}
