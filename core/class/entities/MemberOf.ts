import { Hex, MultiAttestPayload, SignerOrProvider } from "core/types";
import { Attestation } from "../Attestation";
import { AttestationWithTxHash, MemberDetails } from "../types/attestations";
import { AttestationError } from "../SchemaError";
import { GapContract } from "../contract/GapContract";

export interface IMemberOf {
  memberOf: true;
}

export class MemberOf extends Attestation<IMemberOf> {
  details?: MemberDetails;

  async multiAttestPayload(
    currentPayload: MultiAttestPayload = [],
    projectIdx = 0
  ) {
    const payload = [...currentPayload];
    const memberIdx =
      payload.push([this, await this.payloadFor(projectIdx)]) - 1;

    if (this.details) {
      payload.push([this.details, await this.details.payloadFor(memberIdx)]);
    }

    return payload.slice(currentPayload.length, payload.length);
  }

  async attest(
    signer: SignerOrProvider,
    callback?: Function
  ): Promise<AttestationWithTxHash> {
    const payload = await this.multiAttestPayload();
    try {
      const { uids, txHash } = await GapContract.multiAttest(
        signer,
        payload.map((p) => p[1]),
        callback
      );
      const [memberUID, detailsUID] = uids;

      this.uid = memberUID as Hex;
      if (this.details && detailsUID) {
        this.details.uid = detailsUID as Hex;
      }
      return { txHash, uids };
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }
}
