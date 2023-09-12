import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import {
  Hex,
  MultiAttestData,
  MultiAttestPayload,
  TSchemaName,
} from "core/types";
import { GAP } from "../GAP";
import { AttestationRequest } from "@ethereum-attestation-service/eas-sdk";

export class MultiAttest {
  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async send(
    signer: SignerOrProvider,
    payload: MultiAttestData[]
  ): Promise<Hex[]> {
    const contract = GAP.getMulticall(signer);

    const tx = await contract.functions.multiSequentialAttest(payload);
    const result = await tx.wait?.();
    const attestations = result.logs?.map((m) => m.data);

    return attestations as Hex[];
  }

  /**
   * Send a single attestation
   * @param signer
   * @param payload
   * @returns
   */
  static async attest(signer: SignerOrProvider, payload: AttestationRequest) {
    const contract = GAP.getMulticall(signer);

    const tx = await contract.functions.attest(payload);
    const result = await tx.wait?.();
    const attestations = result.logs?.map((m) => m.data);

    return attestations[0] as Hex;
  }
}
