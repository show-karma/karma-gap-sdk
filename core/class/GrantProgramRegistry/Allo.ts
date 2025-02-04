import { ethers, formatEther } from "ethers";
import AlloContractABI from "../../abi/Allo.json";
import { AlloContracts } from "../../consts";
import { Address } from "../types/allo";
import { AbiCoder } from "ethers";
import { Allo } from "@allo-team/allo-v2-sdk/";
import { CreatePoolArgs } from "@allo-team/allo-v2-sdk/dist/Allo/types";
import { TransactionData } from "@allo-team/allo-v2-sdk/dist/Common/types";
import axios from "axios";

// ABI fragment for the Initialized event
const INITIALIZED_EVENT = ["event Initialized(uint256 poolId, bytes data)"];

export class AlloBase {
  private signer: ethers.Signer;
  private contract: ethers.Contract;
  private allo: Allo;
  private pinataJWTToken: string;

  constructor(signer: ethers.Signer, pinataJWTToken: string, chainId: number) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      AlloContracts.alloProxy,
      AlloContractABI,
      signer
    );
    this.allo = new Allo({ chain: chainId });
    this.pinataJWTToken = pinataJWTToken;
  }

  async saveAndGetCID(
    data: any,
    pinataMetadata = { name: "via karma-gap-sdk" }
  ) {
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: data,
          pinataMetadata: pinataMetadata,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.pinataJWTToken}`,
          },
        }
      );
      return res.data.IpfsHash;
    } catch (error) {
      console.log(error);
    }
  }

  async encodeStrategyInitData(
    applicationStart: number,
    applicationEnd: number,
    roundStart: number,
    roundEnd: number,
    payoutToken: string
  ) {
    const encoder = new AbiCoder();
    const initStrategyData = encoder.encode(
      ["bool", "bool", "uint256", "uint256", "uint256", "uint256", "address[]"],
      [
        false, // useRegistryAnchor
        true, // metadataRequired
        applicationStart, // Eg. Curr + 1 hour later   registrationStartTime
        applicationEnd, // Eg. Curr +  5 days later   registrationEndTime
        roundStart, // Eg. Curr + 2 hours later  allocationStartTime
        roundEnd, // Eg. Curr + 10 days later  allocaitonEndTime
        [payoutToken],
      ]
    );

    return initStrategyData;
  }

  async createGrant(args: any, callback?: Function) {
    console.log("Creating grant...");
    const walletBalance = await this.signer.provider.getBalance(
      await this.signer.getAddress()
    );

    console.log(
      "Wallet balance:",
      formatEther(walletBalance.toString()),
      " ETH"
    );

    try {
      const metadata_cid = await this.saveAndGetCID({
        round: args.roundMetadata,
        application: args.applicationMetadata,
      });

      const metadata = {
        protocol: BigInt(1),
        pointer: metadata_cid,
      };

      const initStrategyData = (await this.encodeStrategyInitData(
        args.applicationStart,
        args.applicationEnd,
        args.roundStart,
        args.roundEnd,
        args.payoutToken
      )) as Address;

      const createPoolArgs: CreatePoolArgs = {
        profileId: args.profileId,
        strategy: args.strategy,
        initStrategyData: initStrategyData, // unique to the strategy
        token: args.payoutToken,
        amount: BigInt(args.matchingFundAmt),
        metadata: metadata,
        managers: args.managers,
      };

      callback?.("preparing");
      const txData: TransactionData = this.allo.createPool(createPoolArgs);

      const tx = await this.signer.sendTransaction({
        data: txData.data,
        to: txData.to,
        value: BigInt(txData.value),
      });
      callback?.("pending");
      const receipt = await tx.wait();
      callback?.("confirmed");

      // Create interface to parse the logs
      const iface = new ethers.Interface(INITIALIZED_EVENT);
      let poolId;

      // Find the Initialized event in the logs
      const initializedLog = receipt.logs.find((log) => {
        try {
          const parsed = iface.parseLog(log);
          return parsed.name === "Initialized";
        } catch {
          return false;
        }
      });

      if (initializedLog) {
        const parsedLog = iface.parseLog(initializedLog);
        poolId = parsedLog.args.poolId.toString();
        console.log(`Transaction ${tx.hash} - Found poolId: ${poolId}`);
      } else {
        poolId = receipt.logs[receipt.logs.length - 1].topics[1]; // Fallback to Initialized order logic
        console.log(`No Initialized event found in tx ${tx.hash}`);
      }

      return {
        poolId: BigInt(poolId).toString(),
        txHash: tx.hash,
      };
    } catch (error) {
      console.error(`Failed to create pool: ${error}`);
      throw new Error(`Failed to create pool metadata: ${error}`);
    }
  }

  async updatePoolMetadata(
    poolId: string,
    poolMetadata: any,
    callback?: Function
  ) {
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
    } catch (error) {
      console.error(`Failed to update pool metadata: ${error}`);
      throw new Error(`Failed to update pool metadata: ${error}`);
    }
  }
}
