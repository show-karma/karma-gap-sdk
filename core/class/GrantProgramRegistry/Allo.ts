import { ethers } from "ethers";
import AlloContractABI from "../../abi/Allo.json";
import { AlloContracts } from "core/consts";

export class Allo {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.contract = new ethers.Contract(
      AlloContracts.alloProxy,
      AlloContractABI,
      provider
    );
  }

  async createPool(
    profileId: string,
    initStrategyData: string = "0x", // Null data
    token: string = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // USDC
    amount: number,
    metadata: any,
    managers: string[] = []
  ) {
    try {
      // TODO: Change this according to the strategy
      const strategy = AlloContracts.strategy.DirectGrantsSimpleStrategy;

      const tx = await this.contract.createPool(
        profileId,
        strategy,
        initStrategyData,
        token,
        amount,
        metadata,
        managers
      );
      const receipt = await tx.wait();

      // Get PoolCreated event
      const events = receipt.events;
      const poolCreatedEvent = events.find(
        (event: any) => event.event === "PoolCreated"
      );

      const poolId = poolCreatedEvent.args.poolId;

      return {
        poolId,
        receipt,
      };
    } catch (error) {
      console.error(`Failed to create pool: ${error}`);
    }
  }
}
