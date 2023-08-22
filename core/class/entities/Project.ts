import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import {
  Grant,
  Grantee,
  MemberDetails,
  MemberOf,
  ProjectDetails,
  Tag,
} from "../types/attestations";
import { Hex } from "core/types";
import { GAP } from "../GAP";

export interface IProject {
  project: true;
}

export class Project extends Attestation<IProject> {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[];
  grantee: Grantee;
  tags: Tag[] = [];

  /**
   * Add new members to the project.
   * If any member in the array already exists in the project
   * it'll be ignored.
   * @param signer
   * @param members
   */
  async addMembers(signer: SignerOrProvider, members: MemberOf[]) {
    const newMembers = members.filter(
      (member) => !this.members.find((m) => m.recipient === member.recipient)
    );

    const attestedMembers = <Hex[]>(
      await this.schema.multiAttest(signer, newMembers)
    );

    newMembers.forEach((member, idx) => {
      Object.assign(member, { uid: attestedMembers[idx] });
      Object.assign(member.details, { refUID: attestedMembers[idx] });
    });

    this.members.push(
      ...newMembers.map((member) => {
        delete member.details;
        return member;
      })
    );

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
    const attestedEntities = <Hex[]>(
      await this.schema.multiAttest(signer, entities)
    );

    const toRevoke = this.members
      .filter((member) =>
        entities.find((entity) => entity.refUID === member.uid)
      )
      .map((member) => member.uid);

    if (toRevoke) await this.multiRevoke(signer, toRevoke);

    entities.forEach((entity, idx) => {
      const member = this.members.find(
        (member) => member.uid === entity.refUID
      );
      if (!member) return;

      Object.assign(entity, { uid: attestedEntities[idx] });
      member.details = entity;
    });
  }

  multiRevoke(signer: SignerOrProvider, uids: Hex[]) {
    return this.schema.multiRevoke(signer, uids);
  }
}
