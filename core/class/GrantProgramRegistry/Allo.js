"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlloBase = void 0;
const migration_helpers_1 = require("../../utils/migration-helpers");
const Allo_json_1 = __importDefault(require("../../abi/Allo.json"));
const consts_1 = require("../../consts");
const viem_1 = require("viem");
const viem_contracts_1 = require("../../utils/viem-contracts");
const utils_1 = require("../../utils");
const allo_v2_sdk_1 = require("@allo-team/allo-v2-sdk");
const axios_1 = __importDefault(require("axios"));
// ABI fragment for the Initialized event
const INITIALIZED_EVENT = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint256",
                name: "poolId",
                type: "uint256",
            },
            { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
        ],
        name: "Initialized",
        type: "event",
    },
];
class AlloBase {
    constructor(signer, pinataJWTToken, chainId) {
        this.signer = signer;
        this.contract = (0, viem_contracts_1.createContract)(consts_1.AlloContracts[chainId], Allo_json_1.default, signer);
        this.allo = new allo_v2_sdk_1.Allo({ chain: chainId });
        this.pinataJWTToken = pinataJWTToken;
        this.chainId = chainId;
    }
    async getContract() {
        if (this.contract instanceof Promise) {
            this.contract = await this.contract;
        }
        return this.contract;
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
        const initStrategyData = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bool, bool, uint256, uint256, uint256, uint256, address[]"), [
            false, // useRegistryAnchor
            true, // metadataRequired
            BigInt(applicationStart), // registrationStartTime
            BigInt(applicationEnd), // registrationEndTime
            BigInt(roundStart), // allocationStartTime
            BigInt(roundEnd), // allocationEndTime
            [payoutToken],
        ]);
        return initStrategyData;
    }
    async encodeFundPool(poolId, amount) {
        const encodedData = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("uint256 poolId, uint256 amount"), [BigInt(poolId), amount]);
        return encodedData;
    }
    async estimateCreateProgramGas(createPoolArgs) {
        const address = await this.getSignerAddress();
        const txData = this.allo.createPool(createPoolArgs);
        const gas = await this.estimateGas({
            to: txData.to,
            from: address,
            data: txData.data,
            value: txData.value,
        });
        return gas;
    }
    async getWalletBalance() {
        const address = await this.getSignerAddress();
        const walletBalance = await this.getBalance(address);
        return (0, migration_helpers_1.formatUnits)(walletBalance.toString(), 18); // ETH has 18 decimals
    }
    async createProgram(createPoolArgs) {
        const address = await this.getSignerAddress();
        const walletBalance = await this.getBalance(address);
        console.log("Wallet Balance Before Create Pool TX:", (0, migration_helpers_1.formatUnits)(walletBalance.toString(), 18), "ETH");
        console.log(createPoolArgs);
        const encodedData = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("uint256 _profileId, address _strategy, bytes _initStrategyData, address _token, uint256 _amount, (uint256 protocol, uint256 pointer) _metadata, address[] _managers"), [
            BigInt(createPoolArgs.profileId),
            createPoolArgs.strategy,
            createPoolArgs.initStrategyData,
            createPoolArgs.token,
            createPoolArgs.amount,
            {
                protocol: BigInt(createPoolArgs.metadata.protocol),
                pointer: BigInt(createPoolArgs.metadata.pointer),
            },
            createPoolArgs.managers,
        ]);
        console.log("Encoded data:", encodedData);
        const txData = this.allo.createPool(createPoolArgs);
        const tx = await this.sendTransaction({
            from: address,
            to: txData.to,
            data: txData.data,
            value: txData.value,
        });
        const receipt = await tx.wait();
        if (!receipt) {
            throw new Error("Transaction failed");
        }
        // Find the pool ID from the logs
        const poolId = await this.getPoolIdFromReceipt(receipt);
        if (!poolId) {
            throw new Error("Pool ID not found in transaction receipt");
        }
        console.log(`Transaction ${tx.hash} - Found poolId: ${poolId}`);
        const walletBalanceAfter = await this.getBalance(address);
        console.log("Wallet Balance After Create Pool TX:", (0, migration_helpers_1.formatUnits)(walletBalanceAfter.toString(), 18), "ETH");
        return poolId;
    }
    async getPoolIdFromReceipt(receipt) {
        const logs = receipt.logs || [];
        for (const log of logs) {
            try {
                const decoded = (0, viem_1.decodeEventLog)({
                    abi: INITIALIZED_EVENT,
                    data: log.data,
                    topics: log.topics,
                });
                if (decoded.eventName === "Initialized" &&
                    decoded.args?.poolId) {
                    return decoded.args.poolId;
                }
            }
            catch (e) {
                // Skip logs that don't match the event
                continue;
            }
        }
        return null;
    }
    async getSignerAddress() {
        if ((0, utils_1.isEthersSigner)(this.signer)) {
            return this.signer.getAddress();
        }
        else if ((0, utils_1.isWalletClient)(this.signer)) {
            return this.signer.account?.address;
        }
        throw new Error("Unable to get signer address");
    }
    async getBalance(address) {
        if ((0, utils_1.isEthersSigner)(this.signer)) {
            const provider = this.signer.provider;
            return provider.getBalance(address);
        }
        else if ((0, utils_1.isWalletClient)(this.signer)) {
            return this.signer.getBalance({ address });
        }
        throw new Error("Unable to get balance");
    }
    async estimateGas(tx) {
        if ((0, utils_1.isEthersSigner)(this.signer)) {
            const provider = this.signer.provider;
            return provider.estimateGas(tx);
        }
        else if ((0, utils_1.isWalletClient)(this.signer)) {
            return this.signer.estimateGas(tx);
        }
        throw new Error("Unable to estimate gas");
    }
    async sendTransaction(tx) {
        if ((0, utils_1.isEthersSigner)(this.signer) || (0, utils_1.isWalletClient)(this.signer)) {
            return this.signer.sendTransaction(tx);
        }
        throw new Error("Unable to send transaction");
    }
    async updatePoolMetadata(poolId, poolMetadata, callback) {
        try {
            callback?.("preparing");
            const metadata_cid = await this.saveAndGetCID(poolMetadata);
            const metadata = {
                protocol: 1,
                pointer: metadata_cid,
            };
            const tx = await (await this.getContract()).write("updatePoolMetadata", [poolId, metadata]);
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
