"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteStorage = void 0;
const axios_1 = __importDefault(require("axios"));
class RemoteStorage {
    constructor(storageType, 
    /**
     * If set, will try to POST request to another server instead of
     * using the local instance.
     *
     * > If a response parser is not set, it will try to get { cid: string }.
     */
    sponsor) {
        this.storageType = storageType;
        this.sponsor = sponsor;
        this.interceptRemoteStorage();
    }
    /**
     * If sponsorUrl is set, intercept the save method and send a POST request
     * to the sponsorUrl instead of using the local instance.
     * @returns
     */
    interceptRemoteStorage() {
        if (!this.sponsor?.url)
            return;
        this.save = async (data, schemaName) => {
            const { data: response } = await axios_1.default.post(this.sponsor.url, {
                data: data,
                type: schemaName,
            });
            return this.sponsor.responseParser?.(response) || response.cid;
        };
    }
}
exports.RemoteStorage = RemoteStorage;
