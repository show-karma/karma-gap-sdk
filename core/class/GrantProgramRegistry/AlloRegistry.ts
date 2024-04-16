import { ethers } from "ethers";
import AlloRegistryABI from "../../abi/AlloRegistry.json";
import { AlloContracts } from "core/consts";

export class AlloRegistry {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.contract = new ethers.Contract(
      AlloContracts.registry,
      AlloRegistryABI,
      provider
    );
  }

  async createProfile(
    none: number,
    name: string,
    metadata: any,
    owner: string,
    members: string[]
  ) {
    try {
      const tx = await this.contract.createProfile(
        none,
        name,
        metadata,
        owner,
        members
      );
      const receipt = await tx.wait();

      // Get ProfileCreated event
      const events = receipt.events;
      const profileCreatedEvent = events.find(
        (event: any) => event.event === "ProfileCreated"
      );

      const profileId = profileCreatedEvent.args.profileId;

      return {
        profileId,
        receipt,
      };
    } catch (error) {
      console.error(`Failed to register grant: ${error}`);
    }
  }

  async updateProfileMetadata(profileId: string, metadata: any) {
    try {
      const tx = await this.contract.updateProfileMetadata(profileId, metadata);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error(`Failed to update profile metadata: ${error}`);
    }
  }
}
