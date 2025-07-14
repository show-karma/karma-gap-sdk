import { formatUnits } from "../../utils/migration-helpers";
import AlloContractABI from "../../abi/Allo.json";
import { AlloContracts } from "../../consts";
import { Address } from "../types/allo";
import {
  encodeAbiParameters,
  parseAbiParameters,
  decodeEventLog,
  type Hex,
  PublicClient,
  Transport,
  Chain,
} from "viem";
import { createContract, UniversalContract } from "../../utils/viem-contracts";
import { isWalletClient } from "../../utils";
import { Allo } from "@allo-team/allo-v2-sdk";
import { CreatePoolArgs } from "@allo-team/allo-v2-sdk/dist/Allo/types";
import { TransactionData } from "@allo-team/allo-v2-sdk/dist/Common/types";
import { SignerOrProvider } from "../../types";
import axios from "axios";

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

export class AlloBase {
  private allo: Allo;
  private pinataJWTToken: string;
  private signer: SignerOrProvider;
  private contract: UniversalContract | Promise<UniversalContract>;
  private chainId: number;

  constructor(
    signer: SignerOrProvider,
    pinataJWTToken: string,
    chainId: number
  ) {
    this.signer = signer;
    this.contract = createContract(
      AlloContracts[chainId],
      AlloContractABI as any,
      signer as any
    );
    this.allo = new Allo({ chain: chainId });
    this.pinataJWTToken = pinataJWTToken;
    this.chainId = chainId;
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

  async encodeStrategyInitData(
    applicationStart: number,
    applicationEnd: number,
    roundStart: number,
    roundEnd: number,
    payoutToken: string
  ): Promise<Hex> {
    const initStrategyData = encodeAbiParameters(
      parseAbiParameters(
        "bool, bool, uint256, uint256, uint256, uint256, address[]"
      ),
      [
        false, // useRegistryAnchor
        true, // metadataRequired
        BigInt(applicationStart), // registrationStartTime
        BigInt(applicationEnd), // registrationEndTime
        BigInt(roundStart), // allocationStartTime
        BigInt(roundEnd), // allocationEndTime
        [payoutToken as Address],
      ]
    );

    return initStrategyData as Hex;
  }

  async encodeFundPool(poolId: number, amount: bigint): Promise<Hex> {
    const encodedData = encodeAbiParameters(
      parseAbiParameters("uint256 poolId, uint256 amount"),
      [BigInt(poolId), amount]
    ) as Hex;
    return encodedData;
  }

  async estimateCreateProgramGas(
    createPoolArgs: CreatePoolArgs
  ): Promise<bigint> {
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

  async getWalletBalance(): Promise<string> {
    const address = await this.getSignerAddress();
    const walletBalance = await this.getBalance(address);
    return formatUnits(walletBalance.toString(), 18); // ETH has 18 decimals
  }

  async createProgram(createPoolArgs: CreatePoolArgs): Promise<bigint> {
    const address = await this.getSignerAddress();
    const walletBalance = await this.getBalance(address);

    console.log(
      "Wallet Balance Before Create Pool TX:",
      formatUnits(walletBalance.toString(), 18),
      "ETH"
    );

    console.log(createPoolArgs);

    const encodedData = encodeAbiParameters(
      parseAbiParameters(
        "uint256 _profileId, address _strategy, bytes _initStrategyData, address _token, uint256 _amount, (uint256 protocol, uint256 pointer) _metadata, address[] _managers"
      ),
      [
        BigInt(createPoolArgs.profileId),
        createPoolArgs.strategy as Address,
        createPoolArgs.initStrategyData as Hex,
        createPoolArgs.token as Address,
        createPoolArgs.amount as bigint,
        {
          protocol: BigInt(createPoolArgs.metadata.protocol),
          pointer: BigInt(createPoolArgs.metadata.pointer),
        } as any,
        createPoolArgs.managers as Address[],
      ]
    ) as Hex;

    console.log("Encoded data:", encodedData);

    const txData: TransactionData = this.allo.createPool(createPoolArgs);

    const tx = await this.sendTransaction({
      from: address,
      to: txData.to,
      data: txData.data,
      value: txData.value,
    });

    const walletClient = this.signer as PublicClient<Transport, Chain>;
    const receipt = await walletClient.waitForTransactionReceipt({
      hash: tx.hash,
    });

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
    console.log(
      "Wallet Balance After Create Pool TX:",
      formatUnits(walletBalanceAfter.toString(), 18),
      "ETH"
    );

    return poolId;
  }

  private async getPoolIdFromReceipt(receipt: any): Promise<bigint | null> {
    const logs = receipt.logs || [];

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: INITIALIZED_EVENT,
          data: log.data,
          topics: log.topics,
        });

        if (
          decoded.eventName === "Initialized" &&
          (decoded.args as any)?.poolId
        ) {
          return (decoded.args as any).poolId as bigint;
        }
      } catch (e) {
        // Skip logs that don't match the event
        continue;
      }
    }

    return null;
  }

  private async getSignerAddress(): Promise<string> {
    if (isWalletClient(this.signer)) {
      return (this.signer as any).account?.address;
    }
    throw new Error("Unable to get signer address");
  }

  private async getBalance(address: string): Promise<bigint> {
    if (isWalletClient(this.signer)) {
      return (this.signer as any).getBalance({ address });
    }
    throw new Error("Unable to get balance");
  }

  private async estimateGas(tx: any): Promise<bigint> {
    if (isWalletClient(this.signer)) {
      return (this.signer as any).estimateGas(tx);
    }
    throw new Error("Unable to estimate gas");
  }

  private async sendTransaction(tx: any): Promise<any> {
    if (isWalletClient(this.signer)) {
      return (this.signer as any).sendTransaction(tx);
    }
    throw new Error("Unable to send transaction");
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

      const tx = await ((await this.getContract()) as any).write(
        "updatePoolMetadata",
        [poolId, metadata]
      );
      callback?.("pending");
      const walletClient = this.signer as PublicClient<Transport, Chain>;
      const receipt = await walletClient.waitForTransactionReceipt({
        hash: tx.hash,
      });

      callback?.("confirmed");
      return receipt;
    } catch (error) {
      console.error(`Failed to update pool metadata: ${error}`);
      throw new Error(`Failed to update pool metadata: ${error}`);
    }
  }
}
