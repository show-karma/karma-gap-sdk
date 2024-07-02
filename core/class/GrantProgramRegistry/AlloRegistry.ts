import { ethers } from "ethers";
import AlloRegistryABI from "../../abi/AlloRegistry.json";
import { AlloContracts } from "../../consts";
import { ProfileMetadata } from "../types/allo";
import pinataSDK from "@pinata/sdk";

export class AlloRegistry {
  private contract: ethers.Contract;
  private static ipfsClient: pinataSDK;

  constructor(signer: ethers.Signer, ipfsStorage: pinataSDK) {
    this.contract = new ethers.Contract(
      AlloContracts.registry,
      AlloRegistryABI,
      signer
    );

    AlloRegistry.ipfsClient = ipfsStorage;
  }

  async saveAndGetCID(data: any) {
    try {
      const res = await AlloRegistry.ipfsClient.pinJSONToIPFS(data);
      return res.IpfsHash;
    } catch (error) {
      throw new Error(`Error adding data to IPFS: ${error}`);
    }
  }

  async createProgram(
    nonce: number,
    name: string,
    profileMetadata: ProfileMetadata,
    owner: string,
    members: string[]
  ) {
    console.log("Creating program...");
    try {
      const metadata_cid = await this.saveAndGetCID(profileMetadata);
      const metadata = {
        protocol: 1,
        pointer: metadata_cid,
      };

      const tx = await this.contract.createProfile(
        nonce,
        name,
        metadata,
        owner,
        members
      );
      const receipt = await tx.wait();

      // Get ProfileCreated event
      const profileCreatedEvent = receipt.logs.find(
        (event) => event.eventName === "ProfileCreated"
      );

      return {
        profileId: profileCreatedEvent.args[0],
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error(`Failed to register program: ${error}`);
    }
  }

  async updateProgramMetadata(
    profileId: string,
    profileMetadata: ProfileMetadata
  ) {
    try {
      const metadata_cid = await this.saveAndGetCID(profileMetadata);
      const metadata = {
        protocol: 1,
        pointer: metadata_cid,
      };

      const tx = await this.contract.updateProfileMetadata(profileId, metadata);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error(`Failed to update profile metadata: ${error}`);
    }
  }
}
