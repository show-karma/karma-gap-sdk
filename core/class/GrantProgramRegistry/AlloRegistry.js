"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlloRegistry = void 0;
const ethers_1 = require("ethers");
const AlloRegistry_json_1 = __importDefault(require("../../abi/AlloRegistry.json"));
const consts_1 = require("../../consts");
const axios_1 = __importDefault(require("axios"));
class AlloRegistry {
    constructor(signer, pinataJWTToken) {
        this.contract = new ethers_1.ethers.Contract(consts_1.AlloContracts.registry, AlloRegistry_json_1.default, signer);
        this.pinataJWTToken = pinataJWTToken;
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
    async createProgram(nonce, name, profileMetadata, owner, members) {
        console.log("Creating program...");
        try {
            const metadata_cid = await this.saveAndGetCID(profileMetadata);
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const tx = await this.contract.createProfile(nonce, name, metadata, owner, members);
            const receipt = await tx.wait();
            // Get ProfileCreated event
            const profileCreatedEvent = receipt.logs.find((event) => event.eventName === "ProfileCreated");
            return {
                profileId: profileCreatedEvent.args[0],
                txHash: receipt.hash,
            };
        }
        catch (error) {
            console.error(`Failed to register program: ${error}`);
        }
    }
    async updateProgramMetadata(profileId, profileMetadata) {
        try {
            const metadata_cid = await this.saveAndGetCID(profileMetadata);
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const tx = await this.contract.updateProfileMetadata(profileId, metadata);
            const receipt = await tx.wait();
            return receipt;
        }
        catch (error) {
            console.error(`Failed to update profile metadata: ${error}`);
        }
    }
}
exports.AlloRegistry = AlloRegistry;
