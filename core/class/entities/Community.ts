import { Attestation } from "../Attestation";
import {
  AttestationWithTx,
  CommunityDetails,
  Grantee,
  ICommunityDetails,
} from "../types/attestations";
import { nullRef } from "../../consts";
import { AttestationError } from "../SchemaError";
import { GapSchema } from "../GapSchema";
import { Project } from "./Project";
import {
  Hex,
  IAttestation,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from "core/types";
import { GapContract } from "../contract/GapContract";
import { Grant, IGrant } from "./Grant";
import { ICommunityResponse } from "../karma-indexer/api/types";

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
  async multiAttestPayload() {
    const payload: MultiAttestPayload = [[this, await this.payloadFor(0)]];

    if (this.details) {
      payload.push([this.details, await this.details.payloadFor(0)]);
    }

    if (this.projects?.length) {
      await Promise.all(
        this.projects.map(async (p) =>
          payload.push(...(await p.multiAttestPayload(payload, 0)))
        )
      );
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
    details?: ICommunityDetails,
    callback?: Function
  ): Promise<AttestationWithTx> {
    console.log("Attesting community");
    try {
      if (callback) callback("preparing");
      const { tx: communityTx, uids: communityUID } = await this.schema.attest({
        signer,
        to: this.recipient,
        refUID: nullRef,
        data: this.data,
      });
      this._uid = communityTx[0].hash as Hex;

      console.log(this.uid);
      if (callback) callback("pending");

      if (details) {
        const communityDetails = new CommunityDetails({
          data: details,
          recipient: this.recipient,
          refUID: this.uid,
          schema: this.schema.gap.findSchema("CommunityDetails"),
        });

        const { tx: communityDetailsTx, uids: communityDetailsUID } =
          await communityDetails.attest(signer);
        return {
          tx: [communityTx[0], communityDetailsTx[0]],
          uids: [communityUID[0] as Hex, communityDetailsUID[0] as Hex],
        };
      }
      if (callback) callback("confirmed");
      return { tx: communityTx, uids: communityUID };
    } catch (error) {
      console.error(error);
      throw new AttestationError(
        "ATTEST_ERROR",
        "Error during attestation.",
        error
      );
    }
  }

  static from(
    attestations: ICommunityResponse[],
    network: TNetwork
  ): Community[] {
    return attestations.map((attestation) => {
      const community = new Community({
        ...attestation,
        data: {
          community: true,
        },
        schema: GapSchema.find("Community", network),
        chainID: attestation.chainID,
      });

      if (attestation.details) {
        const { details } = attestation;
        community.details = new CommunityDetails({
          ...details,
          data: {
            ...details.data,
          },
          schema: GapSchema.find("CommunityDetails", network),
          chainID: attestation.chainID,
        });
      }

      if (attestation.grants) {
        const { grants } = attestation;
        community.grants = Grant.from(grants, network);
      }

      return community;
    });
  }
}
