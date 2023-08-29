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

export interface ICommunity {
  community: true;
}

export class Community extends Attestation<ICommunity> {
  projects: Project[] = [];
  details?: CommunityDetails;

  /**
   * Attest a community with its details.
   *
   * If the community exists, it will not be revoked but its details will be updated.
   * @param signer
   * @param details
   */
  async attest(
    signer: SignerOrProvider,
    details: ICommunityDetails
  ): Promise<void> {
    console.log("Attesting community");
    try {
      if (!this.uid || ["0x0", nullRef].includes(this.uid)) {
        const uid = await this.schema.attest({
          data: this.data,
          to: this.recipient,
          refUID: this.refUID,
          signer,
        });
        this._uid = uid;
        console.log("Attested community with UID", this.uid);
      } else {
        console.log("Community already attested", this.uid);
      }

      if (this.details && ![nullRef, "0x0"].includes(this.details.uid)) {
        this.details.setValues(details);
        const detailsId = await this.details.attest(signer);
        Object.assign(this.details, { uid: detailsId });
        return;
      }

      const detailsAttestation = new CommunityDetails({
        data: details,
        createdAt: Date.now(),
        recipient: this.recipient,
        refUID: this.uid,
        schema: GapSchema.find("CommunityDetails"),
        uid: nullRef,
      });

      const detailsId = await detailsAttestation.attest(signer);
      Object.assign(detailsAttestation, { uid: detailsId });
      this.details = detailsAttestation;
    } catch (error) {
      console.error(error);
      throw new AttestationError("ATTEST_ERROR", "Error during attestation.");
    }
  }
}
