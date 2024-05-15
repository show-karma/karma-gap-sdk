import { ethers, formatEther, parseEther } from "ethers";
import AlloContractABI from "../../abi/Allo.json";
import { AlloContracts } from "../../consts";
import { Address, GrantArgs } from "../types/allo";
import { NFTStorage } from "nft.storage";
import { AbiCoder } from "ethers";
import { Allo } from "@allo-team/allo-v2-sdk/";
import { CreatePoolArgs } from "@allo-team/allo-v2-sdk/dist/Allo/types";
import { TransactionData } from "@allo-team/allo-v2-sdk/dist/Common/types";

export class AlloBase {
  private signer: ethers.Signer;
  private contract: ethers.Contract;
  private static ipfsClient: NFTStorage;
  private allo: Allo;

  constructor(signer: ethers.Signer, ipfsStorage: NFTStorage, chainId: number) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      AlloContracts.alloProxy,
      AlloContractABI,
      signer
    );

    this.allo = new Allo({ chain: chainId });
    AlloBase.ipfsClient = ipfsStorage;
  }

  async saveAndGetCID(data: any) {
    try {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const cid = await AlloBase.ipfsClient.storeBlob(blob);
      return cid;
    } catch (error) {
      throw new Error(`Error adding data to IPFS: ${error}`);
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

  async createGrant(args: GrantArgs) {
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

      const txData: TransactionData = this.allo.createPool(createPoolArgs);

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
    } catch (error) {
      console.error(`Failed to create pool: ${error}`);
    }
  }
}