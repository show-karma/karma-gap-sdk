import { MultiAttestPayload } from "core/types";
import { Attestation } from "../Attestation";
import { IMemberDetails } from "../types/attestations";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { AttestationError } from "../SchemaError";
import { MultiAttest } from "../contract/MultiAttest";

export interface IMemberOf {
  memberOf: true;
}

export class MemberOf extends Attestation<IMemberOf> {
  details?: Attestation<IMemberDetails>;

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
      const [memberUID, detailsUID] = await MultiAttest.send(
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
