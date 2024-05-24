"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsStorage = void 0;
const nft_storage_1 = require("nft.storage");
const RemoteStorage_1 = require("./RemoteStorage");
const SchemaError_1 = require("../SchemaError");
const utils_1 = require("../../utils");
class IpfsStorage extends RemoteStorage_1.RemoteStorage {
    constructor(opts, 
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor) {
        super(0 /* STORAGE_TYPE.IPFS */, sponsor);
        this.assert(opts);
        this.client = new nft_storage_1.NFTStorage({ ...opts });
    }
    assert(opts) { }
    async save(data) {
        try {
            const blob = new Blob([JSON.stringify(data)], {
                type: 'application/json',
            });
            const cid = await this.client.storeBlob(blob);
            return cid;
        }
        catch (error) {
            throw new SchemaError_1.RemoteStorageError('REMOTE_STORAGE_UPLOAD', `Error adding data to IPFS`);
        }
    }
    encode(data) {
        return { hash: data, storageType: this.storageType };
    }
    async get(args) {
        return (0, utils_1.getIPFSData)(args.cid);
    }
}
exports.IpfsStorage = IpfsStorage;
