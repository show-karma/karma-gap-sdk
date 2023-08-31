import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { CommunityDetails, ICommunityDetails } from "../types/attestations";
import { Project } from "./Project";
export interface ICommunity {
    community: true;
}
export declare class Community extends Attestation<ICommunity> {
    projects: Project[];
    details?: CommunityDetails;
    /**
     * Attest a community with its details.
     *
     * If the community exists, it will not be revoked but its details will be updated.
     * @param signer
     * @param details
     */
    attest(signer: SignerOrProvider, details: ICommunityDetails): Promise<void>;
}
