"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsStorage = void 0;
const RemoteStorage_1 = require("./RemoteStorage");
const SchemaError_1 = require("../SchemaError");
const utils_1 = require("../../utils");
const axios_1 = __importDefault(require("axios"));
class IpfsStorage extends RemoteStorage_1.RemoteStorage {
    constructor(opts, 
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor) {
        super(0 /* STORAGE_TYPE.IPFS */, sponsor);
        this.assert(opts);
        this.pinataJWTToken = opts.token;
    }
    assert(opts) { }
    async save(data) {
        try {
            const cid = await this.saveAndGetCID(data);
            return cid;
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
    async saveAndGetCID(data, pinataMetadata = { name: "via karma-gap-sdk" }) {
        try {
            const res = await axios_1.default.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                pinataContent: data,
                pinataMetadata: pinataMetadata,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.pinataJWTToken}`,
                },
            });
            return res.data.IpfsHash;
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.IpfsStorage = IpfsStorage;
