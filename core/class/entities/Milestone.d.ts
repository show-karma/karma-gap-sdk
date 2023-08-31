import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { Attestation } from "../Attestation";
export interface IMilestone {
    title: string;
    startsAt: number;
    endsAt: number;
    description: string;
}
export declare class Milestone extends Attestation<IMilestone> implements IMilestone {
    title: string;
    startsAt: number;
    endsAt: number;
    description: string;
    completed: boolean;
    approved: boolean;
    approve(signer: SignerOrProvider): Promise<void>;
    complete(signer: SignerOrProvider): Promise<void>;
}
