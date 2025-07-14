import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "../types";
import { isWalletClient } from "./compatibility";

/**
 * Creates an EAS instance that's compatible with both ethers and viem
 *
 * Since EAS SDK only supports ethers, we need to wrap viem clients
 * to make them compatible with EAS.
 */
export function createEASInstance(contractAddress: string): EAS {
  return new EAS(contractAddress);
}

/**
 * Connects a signer/provider to an EAS instance
 *
 * If the signer is a viem client, it wraps it in an ethers-compatible adapter.
 * If it's already an ethers signer, it connects directly.
 */
export function connectEAS(eas: EAS, signerOrProvider: SignerOrProvider): EAS {
  // If it's a viem client, we need to create an ethers-compatible wrapper
  if (isWalletClient(signerOrProvider)) {
    // Create an ethers provider that wraps the viem client
    const provider = createEthersProviderFromViem(signerOrProvider);
    return eas.connect(provider);
  }

  // For other cases, try direct connection
  return eas.connect(signerOrProvider as any);
}

/**
 * Creates an ethers-compatible provider from a viem wallet client
 *
 * This is a workaround to use viem with the EAS SDK which only supports ethers.
 * It creates a minimal ethers provider that delegates calls to the viem client.
 */
function createEthersProviderFromViem(viemClient: any): any {
  // Create a custom provider that wraps viem client
  const provider = {
    async getNetwork() {
      return {
        chainId: viemClient.chain?.id || 1,
        name: viemClient.chain?.name || "unknown",
      };
    },
    async getBlockNumber() {
      return viemClient.getBlockNumber();
    },
    async getTransactionReceipt(hash: string) {
      return viemClient.getTransactionReceipt({ hash });
    },
    async getBlock(blockNumber: number) {
      return viemClient.getBlock({ blockNumber });
    },
    async getTransaction(hash: string) {
      return viemClient.getTransaction({ hash });
    },
    async estimateGas(transaction: any) {
      return viemClient.estimateGas(transaction);
    },
    async getGasPrice() {
      return viemClient.getGasPrice();
    },
    async getFeeData() {
      const gasPrice = await viemClient.getGasPrice();
      return {
        gasPrice,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / 10n,
      };
    },
    async sendTransaction(transaction: any) {
      const hash = await viemClient.sendTransaction(transaction);
      return {
        hash,
        wait: () => viemClient.waitForTransactionReceipt({ hash }),
      };
    },
  };

  // Create a minimal signer that delegates to viem
  const signer = {
    provider,
    async getAddress() {
      return viemClient.account?.address || viemClient.address;
    },
    async signMessage(message: string) {
      return viemClient.signMessage({ message });
    },
    async signTransaction(transaction: any) {
      // Viem doesn't have a direct signTransaction method
      // This would need to be implemented based on your needs
      throw new Error("signTransaction not implemented for viem adapter");
    },
    async sendTransaction(transaction: any) {
      const hash = await viemClient.sendTransaction(transaction);
      return {
        hash,
        wait: async () => {
          const receipt = await viemClient.waitForTransactionReceipt({ hash });
          return receipt;
        },
      };
    },
    async _signTypedData(domain: any, types: any, value: any) {
      return viemClient.signTypedData({
        account: viemClient.account,
        domain,
        types,
        primaryType: Object.keys(types)[0], // Assuming first type is primary
        message: value,
      });
    },
    connect(provider: any) {
      return this;
    },
  };

  // Merge provider methods into signer for compatibility
  return Object.assign(signer, provider) as any;
}
