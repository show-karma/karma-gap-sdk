"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsStorage = void 0;
const sdk_1 = __importDefault(require("@pinata/sdk"));
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
        this.client = new sdk_1.default({ pinataJWTKey: opts.token });
    }
    assert(opts) { }
    async save(data) {
        try {
            const res = await this.client.pinJSONToIPFS(data);
            return res.IpfsHash;
        }
        catch (error) {
            throw new SchemaError_1.RemoteStorageError("REMOTE_STORAGE_UPLOAD", `Error adding data to IPFS`);
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
