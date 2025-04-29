import { TNetwork } from "core/types";
import { ITrackResponse } from "../karma-indexer/api/types";

export class Track {
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

  constructor(data: any, network: TNetwork) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.communityUID = data.communityUID;
    this.isArchived = data.isArchived ?? false;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
    this.programId = data.programId;
    this.isActive = data.isActive;
    this.network = network;
  }

  static from(data: ITrackResponse[], network: TNetwork): Track[] {
    return data.map((item) => new Track(item, network));
  }
}
