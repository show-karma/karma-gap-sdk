"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Allo = void 0;
const ethers_1 = require("ethers");
const Allo_json_1 = __importDefault(require("../../abi/Allo.json"));
const consts_1 = require("../../consts");
const ethers_2 = require("ethers");
class Allo {
    constructor(signer, ipfsStorage) {
        this.contract = new ethers_1.ethers.Contract(consts_1.AlloContracts.alloProxy, Allo_json_1.default, signer);
        Allo.ipfsClient = ipfsStorage;
    }
    async saveAndGetCID(data) {
        try {
            const blob = new Blob([JSON.stringify(data)], {
                type: "application/json",
            });
            const cid = await Allo.ipfsClient.storeBlob(blob);
            return cid;
        }
        catch (error) {
            throw new Error(`Error adding data to IPFS: ${error}`);
        }
    }
    async encodeStrategyInitData(applicationStart, applicationEnd, roundStart, roundEnd, payoutToken) {
        const encoder = new ethers_2.AbiCoder();
        const initStrategyData = encoder.encode(["bool", "bool", "uint256", "uint256", "uint256", "uint256", "address[]"], [
            true, // useRegistryAnchor
            true, // metadataRequired
            applicationStart, // Eg. Curr + 1 hour later   registrationStartTime
            applicationEnd, // Eg. Curr +  5 days later   registrationEndTime
            roundStart, // Eg. Curr + 2 hours later  allocationStartTime
            roundEnd, // Eg. Curr + 10 days later  allocaitonEndTime
            [
                // "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                payoutToken,
            ], // allowed token
        ]);
        return initStrategyData;
    }
    async createGrant(args) {
        console.log("Creating grant...");
        try {
            const metadata_cid = await this.saveAndGetCID({
                round: args.roundMetadata,
                application: args.applicationMetadata,
            });
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const initStrategyData = await this.encodeStrategyInitData(args.applicationStart, args.applicationEnd, args.roundStart, args.roundEnd, args.payoutToken);
            const tx = await this.contract.createPool(args.profileId, args.strategy, initStrategyData, args.payoutToken, args.matchingFundAmt, metadata, args.managers);
            const receipt = await tx.wait();
            // Get ProfileCreated event
            const poolCreatedEvent = receipt.logs.find((event) => event.eventName === "PoolCreated");
            return {
                poolId: poolCreatedEvent.args[0],
                txHash: receipt.hash,
            };
        }
        catch (error) {
            console.error(`Failed to create pool: ${error}`);
        }
    }
}
exports.Allo = Allo;
