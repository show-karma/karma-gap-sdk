import { MultiAttestPayload, SignerOrProvider } from "core/types";
import { Attestation } from "../Attestation";
import { MemberDetails } from "../types/attestations";
export interface IMemberOf {
    memberOf: true;
}
export declare class MemberOf extends Attestation<IMemberOf> {
    details?: MemberDetails;
    multiAttestPayload(currentPayload?: MultiAttestPayload, projectIdx?: number): Promise<[Attestation<unknown, import("..").GapSchema>, import("core/types").RawMultiAttestPayload][]>;
    attest(signer: SignerOrProvider): Promise<void>;
}
