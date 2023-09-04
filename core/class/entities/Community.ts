import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import {
  CommunityDetails,
  Grantee,
  ICommunityDetails,
} from "../types/attestations";
import { nullRef } from "../../consts";
import { AttestationError } from "../SchemaError";
import { GapSchema } from "../GapSchema";
import { Project } from "./Project";
import { Hex, MultiAttestPayload } from "core/types";
import { GAP } from "../GAP";
import { MultiAttest } from "../contract/MultiAttest";
import { Grant } from "./Grant";

export interface ICommunity {
  community: true;
  grants: Grant[];
}

export class Community extends Attestation<ICommunity> {
  projects: Project[] = [];
  grants: Grant[] = [];
  details?: CommunityDetails;

  /**
   * Creates the payload for a multi-attestation.
   *
   * > if Current payload is set, it'll be used as the base payload
   * and the project should refer to an index of the current payload,
   * usually the community position.
   *
   * @param payload
   * @param refIdx
   */
  multiAttestPayload() {
    const payload: MultiAttestPayload = [[this, this.payloadFor(0)]];

    if (this.details) {
      payload.push([this.details, this.details.payloadFor(0)]);
    }

    if (this.projects?.length) {
      this.projects.forEach((p) => {
        payload.push(...p.multiAttestPayload(payload, 0));
      });
    }

    return payload;
  }

  /**
   * Attest a community with its details.
   *
   * If the community exists, it will not be revoked but its details will be updated.
   * @param signer
   * @param details
   */
  async attest(
    signer: SignerOrProvider,
    details?: ICommunityDetails
  ): Promise<void> {
    console.log("Attesting community");
    try {
      if (details) {
        this.details = new CommunityDetails({
          data: details,
          schema: GapSchema.find("CommunityDetails"),
          uid: nullRef,
          recipient: this.recipient,
        });
      }

      const payload = this.multiAttestPayload();

      const uids = await MultiAttest.send(
        signer,
        payload.map((p) => p[1])
      );

      uids.forEach((uid, index) => {
        payload[index][0].uid = uid;
      });
      console.log(this.uid);
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", "Error during attestation.");
    }
  }
}
