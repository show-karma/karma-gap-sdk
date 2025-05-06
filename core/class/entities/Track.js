"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Track = void 0;
class Track {
    constructor(data, network) {
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
    static from(data, network) {
        return data.map((item) => new Track(item, network));
    }
}
exports.Track = Track;
