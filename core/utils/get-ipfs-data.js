"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIPFSData = void 0;
const axios_1 = __importDefault(require("axios"));
async function getIPFSData(cid) {
    try {
        const { data } = await axios_1.default.get(`https://ipfs.io/ipfs/${cid}`);
        return data;
    }
    catch (err) {
        throw new Error(`Error to retrive data for CID: ${cid}`);
    }
}
exports.getIPFSData = getIPFSData;
