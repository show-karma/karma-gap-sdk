import { MultiAttestPayload } from "core/types";
import { Attestation } from "../Attestation";
import { MemberDetails } from "../types/attestations";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
export interface IMemberOf {
    memberOf: true;
}
export declare class MemberOf extends Attestation<IMemberOf> {
    details?: MemberDetails;
    multiAttestPayload(currentPayload?: MultiAttestPayload, projectIdx?: number): [Attestation<unknown, import("..").GapSchema>, import("core/types").MultiAttestData][];
    attest(signer: SignerOrProvider): Promise<void>;
}
