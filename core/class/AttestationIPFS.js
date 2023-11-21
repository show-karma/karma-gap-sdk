"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttestationIPFS = void 0;
const IPFS_1 = require("./IPFS/IPFS");
class AttestationIPFS extends IPFS_1.IPFS {
    /**
    * retrieve Attestation Details from IPFS by hash (CID)
    */
    async getData(ipfsHash) {
        // implement using Axios
        return new Promise(() => { });
    }
    encode(data, storageType) {
        return JSON.stringify({ ipfsHash: data, type: storageType });
    }
}
exports.AttestationIPFS = AttestationIPFS;
