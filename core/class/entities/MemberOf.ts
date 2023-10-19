import { MultiAttestPayload, SignerOrProvider } from "core/types";
import { Attestation } from "../Attestation";
import { MemberDetails } from "../types/attestations";
import { AttestationError } from "../SchemaError";
import { GapContract } from "../contract/GapContract";

export interface IMemberOf {
  memberOf: true;
}

export class MemberOf extends Attestation<IMemberOf> {
  details?: MemberDetails;

  multiAttestPayload(currentPayload: MultiAttestPayload = [], projectIdx = 0) {
    const payload = [...currentPayload];
    const memberIdx = payload.push([this, this.payloadFor(projectIdx)]) - 1;

    if (this.details) {
      payload.push([this.details, this.details.payloadFor(memberIdx)]);
    }

    return payload.slice(currentPayload.length, payload.length);
  }

  async attest(signer: SignerOrProvider) {
    const payload = this.multiAttestPayload();
    try {
      const [memberUID, detailsUID] = await GapContract.multiAttest(
        signer,
        payload.map((p) => p[1])
      );

      this.uid = memberUID;
      if (this.details && detailsUID) {
        this.details.uid = detailsUID;
      }
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", error.message);
    }
  }
}
