import { ethers } from "ethers";
import AlloRegistryABI from "../../abi/AlloRegistry.json";
import { AlloContracts } from "../../consts";
import { ProfileMetadata } from "../types/allo";

export class AlloRegistry {
  private contract: ethers.Contract;

  constructor(signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      AlloContracts.registry,
      AlloRegistryABI,
      signer
    );
  }

  async createProgram(
    nonce: number,
    name: string,
    metadataCid: string,
    owner: string,
    members: string[]
  ) {
    console.log("Creating program...");
    try {
      const metadata = {
        protocol: 1,
        pointer: metadataCid,
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
    metadataCid: string
  ) {
    try {
      const metadata = {
        protocol: 1,
        pointer: metadataCid,
      };

      const tx = await this.contract.updateProfileMetadata(profileId, metadata);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error(`Failed to update profile metadata: ${error}`);
    }
  }
}
