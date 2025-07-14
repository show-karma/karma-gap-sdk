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
export async function createContract(
  address: string,
  abi: Abi,
  provider: any
): Promise<UniversalContract> {
  let publicClient: PublicClient<Transport, Chain>;
  let walletClient: WalletClient<Transport, Chain, Account> | undefined;

  if (provider.mode !== "publicClient") {
    walletClient = provider;
    publicClient = provider; // Wallet clients can also read
  } else {
    publicClient = provider;
  }

  const contractAddress = address as Address;

  // Create the contract interface
  const contract: UniversalContract = {
    address: contractAddress,
    abi,

    async read(
      functionName: string,
      args: readonly unknown[] = []
    ): Promise<unknown> {
      try {
        // Ensure args is an array and filter out undefined values
        const cleanArgs = Array.isArray(args)
          ? args.filter((arg) => arg !== undefined)
          : [];

        // Use viem's readContract action directly
        const result = await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName,
          args: cleanArgs,
        });

        return result;
      } catch (error) {
        console.error("Contract read error:", {
          functionName,
          args,
          error: error.message,
          contractAddress,
        });
        throw error;
      }
    },

    async write(
      functionName: string,
      args: readonly unknown[] = [],
      options: any = {}
    ): Promise<Hash> {
      if (!walletClient) {
        throw new Error("Wallet client required for write operations");
      }

      const cleanArgs = Array.isArray(args)
        ? args.filter((arg) => arg !== undefined)
        : [];

      return await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName,
        args: cleanArgs,
        ...options,
      });
    },

    async estimateGas(
      functionName: string,
      args: readonly unknown[] = []
    ): Promise<bigint> {
      const cleanArgs = Array.isArray(args)
        ? args.filter((arg) => arg !== undefined)
        : [];

      return await publicClient.estimateContractGas({
        address: contractAddress,
        abi,
        functionName,
        args: cleanArgs,
      });
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
  if (provider?.mode === "walletClient") {
    return true;
  }

  return false;
}
