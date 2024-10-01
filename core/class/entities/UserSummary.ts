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

export interface IUserSummary {
  aboutMe: string;
  github?: string;
  twitter?: string;
  linkdin?: number;
}

export class UserSummary
  extends Attestation<IUserSummary>
  implements IUserSummary
{
  aboutMe: string;
  github?: string;
  twitter?: string;
  linkdin?: number;

  constructor(data: AttestationArgs<IUserSummary, GapSchema>) {
    (data.data as any).type = "user-summary";
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
    console.log("Attesting UserSummary");
    try {
      if (callback) callback("preparing");
      const { tx: UserSummaryTx, uids: UserSummaryUID } = await this.schema.attest({
        signer,
        to: this.recipient,
        refUID: nullRef,
        data: this.data,
      });
      this._uid = UserSummaryUID[0] as Hex;

      console.log(this.uid);
      if (callback) callback("pending");

      if (callback) callback("confirmed");
      return { tx: UserSummaryTx, uids: UserSummaryUID };
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
    attestation: UserSummary,
    network: TNetwork
  ): UserSummary {
    return new UserSummary({
      ...attestation,
      data: {
        ...attestation.data,
      },
      schema: new AllGapSchemas().findSchema(
        "UserSummary",
        chainIdToNetwork[attestation.chainID] as TNetwork
      ),
      chainID: attestation.chainID,
    });
  }
}
