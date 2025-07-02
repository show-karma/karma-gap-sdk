/**
 * Universal contract interface for viem
 * Provides a unified way to interact with contracts using viem
 */

import {
  type Abi,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  encodeFunctionData,
  decodeFunctionResult,
  getContract,
} from "viem";
import {
  isEthersProvider,
  isEthersSigner,
  adaptEthersToViem,
} from "./provider-adapter";

/**
 * Universal contract interface that works with viem
 * Provides strong typing for contract interactions
 */
export interface UniversalContract {
  address: Address;
  abi: Abi;

  /**
   * Read data from the contract (view/pure functions)
   */
  read(functionName: string, args?: readonly unknown[]): Promise<unknown>;

  /**
   * Write data to the contract (non-payable functions)
   */
  write(
    functionName: string,
    args?: readonly unknown[],
    options?: any
  ): Promise<Hash>;

  /**
   * Estimate gas for contract functions
   */
  estimateGas(functionName: string, args?: readonly unknown[]): Promise<bigint>;

  /**
   * Encode function data
   */
  encodeFunctionData(functionName: string, args?: readonly unknown[]): Hex;

  /**
   * Decode function result
   */
  decodeFunctionResult(functionName: string, data: Hex): unknown;
}

/**
 * Create a universal contract instance
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param provider - Viem client or ethers provider/signer
 * @returns Universal contract instance
 */
export async function createUniversalContract(
  address: string,
  abi: Abi,
  provider: any
): Promise<UniversalContract> {
  let publicClient: PublicClient<Transport, Chain>;
  let walletClient: WalletClient<Transport, Chain, Account> | undefined;

  // Handle ethers providers/signers
  if (isEthersProvider(provider) || isEthersSigner(provider)) {
    const viemClient = await adaptEthersToViem(provider);
    if ("mode" in viemClient && viemClient.mode === "walletClient") {
      walletClient = viemClient as WalletClient<Transport, Chain, Account>;
      publicClient = viemClient as any; // Wallet clients can also read
    } else {
      publicClient = viemClient as PublicClient<Transport, Chain>;
    }
  } else {
    // Already viem clients
    if (provider.mode === "walletClient") {
      walletClient = provider;
      publicClient = provider; // Wallet clients can also read
    } else {
      publicClient = provider;
    }
  }

  const contractAddress = address as Address;

  // Create viem contract instances
  const readContract = getContract({
    address: contractAddress,
    abi,
    client: publicClient as any,
  });

  const writeContract = walletClient
    ? getContract({
        address: contractAddress,
        abi,
        client: walletClient as any,
      })
    : null;

  // Create the contract interface
  const contract: UniversalContract = {
    address: contractAddress,
    abi,

    async read(
      functionName: string,
      args: readonly unknown[] = []
    ): Promise<unknown> {
      return ((readContract as any).read as any)[functionName](...args);
    },

    async write(
      functionName: string,
      args: readonly unknown[] = [],
      options: any = {}
    ): Promise<Hash> {
      if (!writeContract) {
        throw new Error("Wallet client required for write operations");
      }

      return ((writeContract as any).write as any)[functionName](
        ...args,
        options
      );
    },

    async estimateGas(
      functionName: string,
      args: readonly unknown[] = []
    ): Promise<bigint> {
      return ((readContract as any).estimateGas as any)[functionName](...args);
    },

    encodeFunctionData(
      functionName: string,
      args: readonly unknown[] = []
    ): Hex {
      return encodeFunctionData({
        abi,
        functionName,
        args,
      } as any);
    },

    decodeFunctionResult(functionName: string, data: Hex): unknown {
      return decodeFunctionResult({
        abi,
        functionName,
        data,
      } as any);
    },
  };

  return contract;
}

/**
 * Helper to check if a provider supports write operations
 */
export function supportsWrites(provider: any): boolean {
  if (isEthersSigner(provider)) {
    return true;
  }

  if (provider?.mode === "walletClient") {
    return true;
  }

  return false;
}
