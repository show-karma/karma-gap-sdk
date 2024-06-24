"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlloBase = void 0;
const ethers_1 = require("ethers");
const Allo_json_1 = __importDefault(require("../../abi/Allo.json"));
const consts_1 = require("../../consts");
const ethers_2 = require("ethers");
const allo_v2_sdk_1 = require("@allo-team/allo-v2-sdk/");
class AlloBase {
    constructor(signer, ipfsStorage, chainId) {
        this.signer = signer;
        this.contract = new ethers_1.ethers.Contract(consts_1.AlloContracts.alloProxy, Allo_json_1.default, signer);
        this.allo = new allo_v2_sdk_1.Allo({ chain: chainId });
        AlloBase.ipfsClient = ipfsStorage;
    }
    async saveAndGetCID(data) {
        try {
            const blob = new Blob([JSON.stringify(data)], {
                type: "application/json",
            });
            const cid = await AlloBase.ipfsClient.storeBlob(blob);
            return cid;
        }
        catch (error) {
            throw new Error(`Error adding data to IPFS: ${error}`);
        }
    }
    async encodeStrategyInitData(applicationStart, applicationEnd, roundStart, roundEnd, payoutToken) {
        const encoder = new ethers_2.AbiCoder();
        const initStrategyData = encoder.encode(["bool", "bool", "uint256", "uint256", "uint256", "uint256", "address[]"], [
            false, // useRegistryAnchor
            true, // metadataRequired
            applicationStart, // Eg. Curr + 1 hour later   registrationStartTime
            applicationEnd, // Eg. Curr +  5 days later   registrationEndTime
            roundStart, // Eg. Curr + 2 hours later  allocationStartTime
            roundEnd, // Eg. Curr + 10 days later  allocaitonEndTime
            [payoutToken],
        ]);
        return initStrategyData;
    }
    async createGrant(args) {
        console.log("Creating grant...");
        const walletBalance = await this.signer.provider.getBalance(await this.signer.getAddress());
        console.log("Wallet balance:", (0, ethers_1.formatEther)(walletBalance.toString()), " ETH");
        try {
            const metadata_cid = await this.saveAndGetCID({
                round: args.roundMetadata,
                application: args.applicationMetadata,
            });
            const metadata = {
                protocol: BigInt(1),
                pointer: metadata_cid,
            };
            const initStrategyData = (await this.encodeStrategyInitData(args.applicationStart, args.applicationEnd, args.roundStart, args.roundEnd, args.payoutToken));
            const createPoolArgs = {
                profileId: args.profileId,
                strategy: args.strategy,
                initStrategyData: initStrategyData, // unique to the strategy
                token: args.payoutToken,
                amount: BigInt(args.matchingFundAmt),
                metadata: metadata,
                managers: args.managers,
            };
            const txData = this.allo.createPool(createPoolArgs);
            const tx = await this.signer.sendTransaction({
                data: txData.data,
                to: txData.to,
                value: BigInt(txData.value),
            });
            const receipt = await tx.wait();
            // Get ProfileCreated event
            const poolId = receipt.logs[receipt.logs.length - 1].topics[0];
            return {
                poolId: poolId,
                txHash: tx.hash,
            };
        }
        catch (error) {
            console.error(`Failed to create pool: ${error}`);
        }
    }
    async updatePoolMetadata(poolId, poolMetadata) {
        try {
            const metadata_cid = await this.saveAndGetCID(poolMetadata);
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const tx = await this.contract.updatePoolMetadata(poolId, metadata);
            const receipt = await tx.wait();
            return receipt;
        }
        catch (error) {
            console.error(`Failed to update pool metadata: ${error}`);
        }
    }
}
exports.AlloBase = AlloBase;
