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
const axios_1 = __importDefault(require("axios"));
class AlloBase {
    constructor(signer, pinataJWTToken, chainId) {
        this.signer = signer;
        this.contract = new ethers_1.ethers.Contract(consts_1.AlloContracts.alloProxy, Allo_json_1.default, signer);
        this.allo = new allo_v2_sdk_1.Allo({ chain: chainId });
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
    async encodeStrategyInitData(applicationStart, applicationEnd, roundStart, roundEnd, payoutToken) {
        const encoder = new ethers_2.AbiCoder();
        const initStrategyData = encoder.encode(["bool", "bool", "uint256", "uint256", "uint256", "uint256", "address[]"], [
            false,
            true,
            applicationStart,
            applicationEnd,
            roundStart,
            roundEnd,
            [payoutToken],
        ]);
        return initStrategyData;
    }
    async createGrant(args, callback) {
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
                initStrategyData: initStrategyData,
                token: args.payoutToken,
                amount: BigInt(args.matchingFundAmt),
                metadata: metadata,
                managers: args.managers,
            };
            callback?.("preparing");
            const txData = this.allo.createPool(createPoolArgs);
            const tx = await this.signer.sendTransaction({
                data: txData.data,
                to: txData.to,
                value: BigInt(txData.value),
            });
            callback?.("pending");
            const receipt = await tx.wait();
            callback?.("confirmed");
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
    async updatePoolMetadata(poolId, poolMetadata, callback) {
        try {
            callback?.("preparing");
            const metadata_cid = await this.saveAndGetCID(poolMetadata);
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const tx = await this.contract.updatePoolMetadata(poolId, metadata);
            callback?.("pending");
            const receipt = await tx.wait();
            callback?.("confirmed");
            return receipt;
        }
        catch (error) {
            console.error(`Failed to update pool metadata: ${error}`);
            throw new Error(`Failed to update pool metadata: ${error}`);
        }
    }
}
exports.AlloBase = AlloBase;
