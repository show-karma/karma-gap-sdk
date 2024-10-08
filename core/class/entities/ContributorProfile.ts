import { Attestation, AttestationArgs } from "../Attestation";
import {
  AttestationWithTx,
} from "../types/attestations";
import { chainIdToNetwork, nullRef } from "../../consts";
import { AttestationError } from "../SchemaError";
import { GapSchema } from "../GapSchema";
import {
  Hex,
  MultiAttestPayload,
  SignerOrProvider,
  TNetwork,
} from "core/types";
import { AllGapSchemas } from "../AllGapSchemas";

export interface IContributorProfile {
  name: string;
  aboutMe?: string;
  github?: string;
  twitter?: string;
  linkedin?: number;
}

export class ContributorProfile
  extends Attestation<IContributorProfile>
  implements IContributorProfile
{
  name: string; 
  aboutMe?: string;
  github?: string;
  twitter?: string;
  linkedin?: number;

  constructor(data: AttestationArgs<IContributorProfile, GapSchema>) {
    (data.data as any).type = "contributor-profile";
    super(data);
  }

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
    callback?: Function
  ): Promise<AttestationWithTx> {
    console.log("Attesting ContributorProfile");
    try {
      if (callback) callback("preparing");
      const { tx: ContributorProfileTx, uids: ContributorProfileUID } = await this.schema.attest({
        signer,
        to: this.recipient,
        refUID: nullRef,
        data: this.data,
      });
      this._uid = ContributorProfileUID[0] as Hex;

      console.log(this.uid);
      if (callback) callback("pending");

      if (callback) callback("confirmed");
      return { tx: ContributorProfileTx, uids: ContributorProfileUID };
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
    attestation: ContributorProfile,
    network: TNetwork
  ): ContributorProfile {
    return new ContributorProfile({
      ...attestation,
      data: {
        ...attestation.data,
      },
      schema: new AllGapSchemas().findSchema(
        "ContributorProfile",
        chainIdToNetwork[attestation.chainID] as TNetwork
      ),
      chainID: attestation.chainID,
    });
  }
}
