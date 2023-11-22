"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFS = void 0;
const nft_storage_1 = require("nft.storage");
const SchemaError_1 = require("../SchemaError");
class IPFS {
    constructor(ipfsKey) {
        this.client = new nft_storage_1.NFTStorage({ token: ipfsKey });
    }
    /**
    * Insert the data in the IPFS and return the cid.
    */
    async save(data) {
        try {
            const blob = new nft_storage_1.Blob([JSON.stringify(data)], { type: 'application/json' });
            const cid = await this.client.storeBlob(blob);
            return cid;
        }
        catch (error) {
            throw new SchemaError_1.AttestationError('IPFS_UPLOAD', `Error adding data to IPFS`);
        }
    }
}
exports.IPFS = IPFS;
