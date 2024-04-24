import { ethers } from "ethers";
import AlloContractABI from "../../abi/Allo.json";
import { AlloContracts } from "../../consts";
import { GrantArgs } from "../types/allo";
import { NFTStorage } from "nft.storage";
import { AbiCoder } from "ethers";

export class Allo {
  private contract: ethers.Contract;
  private static ipfsClient: NFTStorage;

  constructor(signer: ethers.Signer, ipfsStorage: NFTStorage) {
    this.contract = new ethers.Contract(
      AlloContracts.alloProxy,
      AlloContractABI,
      signer
    );

    Allo.ipfsClient = ipfsStorage;
  }

  async saveAndGetCID(data: any) {
    try {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const cid = await Allo.ipfsClient.storeBlob(blob);
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
      ]
    );

    return initStrategyData;
  }

  async createGrant(args: GrantArgs) {
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

      const initStrategyData = await this.encodeStrategyInitData(
        args.applicationStart,
        args.applicationEnd,
        args.roundStart,
        args.roundEnd,
        args.payoutToken
      );

      const tx = await this.contract.createPool(
        args.profileId,
        args.strategy,
        initStrategyData,
        args.payoutToken,
        args.matchingFundAmt,
        metadata,
        args.managers
      );
      const receipt = await tx.wait();

      // Get ProfileCreated event
      const poolCreatedEvent = receipt.logs.find(
        (event) => event.eventName === "PoolCreated"
      );

      return {
        poolId: poolCreatedEvent.args[0],
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error(`Failed to create pool: ${error}`);
    }
  }
}
