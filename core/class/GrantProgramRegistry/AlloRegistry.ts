import { encodeAbiParameters, parseAbiParameters, type Hex } from "viem";
import {
  createUniversalContract,
  type UniversalContract,
} from "../../utils/viem-contracts";
import type { SignerOrProvider } from "../../types";
import AlloRegistryABI from "../../abi/AlloRegistry.json";
import { AlloContracts } from "../../consts";
import { ProfileMetadata } from "../types/allo";
import axios from "axios";

export class AlloRegistry {
  private contract: UniversalContract | Promise<UniversalContract>;
  private pinataJWTToken: string;
  private signer: SignerOrProvider;

  constructor(
    signer: SignerOrProvider,
    pinataJWTToken: string,
    chainId: number
  ) {
    this.signer = signer;
    this.contract = createUniversalContract(
      AlloContracts[chainId],
      AlloRegistryABI as any,
      signer as any
    );

    this.pinataJWTToken = pinataJWTToken;
  }

  private async getContract(): Promise<UniversalContract> {
    if (this.contract instanceof Promise) {
      this.contract = await this.contract;
    }
    return this.contract;
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

      const tx = await ((await this.getContract()) as any).write(
        "createProfile",
        [nonce, name, metadata, owner, members]
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

      const tx = await ((await this.getContract()) as any).write(
        "updateProfileMetadata",
        [profileId, metadata]
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error(`Failed to update profile metadata: ${error}`);
    }
  }
}
