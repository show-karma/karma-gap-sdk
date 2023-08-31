import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import {
  Grantee,
  MemberDetails,
  ProjectDetails,
  Tag,
} from "../types/attestations";
import { Hex, MultiAttestPayload } from "core/types";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { mapFilter } from "../../utils";
import { Grant } from "./Grant";
import { nullRef } from "../../consts";
import { GAP } from "../GAP";
import { MemberOf } from "./MemberOf";
import { MultiAttest } from "../contract/MultiAttest";

export interface IProject {
  project: true;
}

export class Project extends Attestation<IProject> {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[] = [];
  grantee: Grantee;
  tags: Tag[] = [];

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
  multiAttestPayload(
    currentPayload: MultiAttestPayload = [],
    communityIdx = 0
  ): MultiAttestPayload {
    const payload = [...currentPayload];
    const projectIdx = payload.push([this, this.payloadFor(communityIdx)]) - 1;

    if (this.details) {
      payload.push([this.details, this.details.payloadFor(projectIdx)]);
      if (this.details.links?.length) {
        this.details.links.forEach((link) => {
          payload.push([link, link.payloadFor(projectIdx)]);
        });
      }
    }

    if (this.members?.length) {
      this.members.forEach((m) => {
        payload.push(...m.multiAttestPayload(payload, projectIdx));
      });
    }

    if (this.grants?.length) {
      this.grants.forEach((g) => {
        payload.push(...g.multiAttestPayload(payload, projectIdx));
      });
    }

    return payload.slice(currentPayload.length, payload.length);
  }

  async attest(signer: SignerOrProvider): Promise<void> {
    if (!this.refUID)
      throw new AttestationError(
        "INVALID_REF_UID",
        "Project must have a reference UID to a community."
      );

    const payload = this.multiAttestPayload();
    const uids = await MultiAttest.send(
      signer,
      payload.map((p) => p[1])
    );

    uids.forEach((uid, index) => {
      payload[index][0].uid = uid;
    });
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
  async addMembers(signer: SignerOrProvider, members: MemberDetails[]) {
    const newMembers = mapFilter(
      members,
      (member) => !this.members.find((m) => m.recipient === member.recipient),
      // (member) => !!member,
      (details) => {
        const member = new MemberOf({
          data: { memberOf: true },
          refUID: this.uid,
          schema: GapSchema.find("MemberOf"),
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

    const attestedMembers = <Hex[]>await this.schema.multiAttest(
      signer,
      newMembers.map((m) => m.member)
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
      console.log("Revoking details");
      await this.cleanDetails(signer, toRevoke);
    }

    console.log(`Creating ${entities.length} new member details`);

    const attestedEntities = <Hex[]>(
      await this.schema.multiAttest(signer, entities)
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
    const memberDetails = GapSchema.find("MemberDetails");

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
    const memberOf = GapSchema.find("MemberOf");

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
}
