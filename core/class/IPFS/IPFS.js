"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFS = void 0;
const nft_storage_1 = require("nft.storage");
class IPFS {
    constructor(ipfsKey) {
        this.client = new nft_storage_1.NFTStorage({ token: ipfsKey });
    }
    /**
    * Insert the data in the IPFS and return the cid.
    */
    async save(data) {
        try {
            console.log("Sending IPFS: ", data);
            const blob = new nft_storage_1.Blob([JSON.stringify(data)], { type: 'application/json' });
            const cid = await this.client.storeBlob(blob);
            console.log("Result ipfs: ", cid);
            return cid;
        }
        catch (error) {
            console.error('Error adding data to IPFS:', error);
            throw error;
        }
    }
}
exports.IPFS = IPFS;
