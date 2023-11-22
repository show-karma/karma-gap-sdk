"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttestationIPFS = void 0;
const IPFS_1 = require("./IPFS/IPFS");
class AttestationIPFS extends IPFS_1.IPFS {
    encode(data, storageType) {
        return { ipfsHash: data, type: storageType };
    }
}
exports.AttestationIPFS = AttestationIPFS;
