import { TNetwork } from "core/types";
import { ITrackResponse } from "../karma-indexer/api/types";
export declare class Track {
    id: string;
    name: string;
    description?: string;
    communityUID: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    programId?: string;
    isActive?: boolean;
    network: TNetwork;
    constructor(data: any, network: TNetwork);
    static from(data: ITrackResponse[], network: TNetwork): Track[];
}
