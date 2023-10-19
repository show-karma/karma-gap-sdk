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
import { IAttestation, MultiAttestPayload, SignerOrProvider } from "core/types";
import { GapContract } from "../contract/GapContract";
import { Grant, IGrant } from "./Grant";

interface _Community extends Community {}
export interface ICommunity {
  community: true;
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
      this._uid = await this.schema.attest({
        signer,
        to: this.recipient,
        refUID: nullRef,
        data: this.data,
      });
      console.log(this.uid);
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", "Error during attestation.");
    }
  }

  static from(attestations: _Community[]): Community[] {
    return attestations.map((attestation) => {
      const community = new Community({
        ...attestation,
        data: {
          community: true,
        },
        schema: GapSchema.find("Community"),
      });

      if (attestation.details) {
        const { details } = attestation;
        community.details = new CommunityDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: GapSchema.find("CommunityDetails"),
        });
      }

      if (attestation.grants) {
        const { grants } = attestation as Community;
        community.grants = Grant.from(grants);
      }

      return community;
    });
  }
}
