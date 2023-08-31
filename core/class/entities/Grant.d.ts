import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
import { GrantDetails, GrantRound } from "../types/attestations";
import { IMilestone, Milestone } from "./Milestone";
export interface IGrant {
    grant: true;
}
export declare class Grant extends Attestation<IGrant> {
    details?: GrantDetails;
    verified?: boolean;
    round?: GrantRound;
    milestones: Milestone[];
    verify(signer: SignerOrProvider): Promise<void>;
    /**
     * Add milestones to the grant.
     * @param signer
     * @param milestones
     */
    addMilestones(signer: SignerOrProvider, milestones: IMilestone[]): Promise<void>;
}
