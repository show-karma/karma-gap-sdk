/**
 * Migration helpers for converting ethers types to viem
 * Provides utilities for backward compatibility
 */

import type {
  Hex,
  Hash,
  Address,
  TransactionRequest as ViemTransactionRequest,
  TransactionReceipt as ViemTransactionReceipt,
} from "viem";
import {
  parseEther,
  parseUnits as viemParseUnits,
  formatEther,
  formatUnits as viemFormatUnits,
  isAddress as viemIsAddress,
  getAddress as viemGetAddress,
} from "viem";

/**
 * Convert ethers BigNumber to bigint
 * @param value - Ethers BigNumber or compatible value
 * @returns bigint value
 */
export function ethersBigNumberToBigInt(value: any): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (value?._isBigNumber || value?.type === "BigNumber") {
    return BigInt(value.toString());
  }

  if (typeof value === "string" || typeof value === "number") {
    return BigInt(value);
  }

  return 0n;
}

/**
 * Convert ethers address to viem Address
 * @param address - Ethers address format
 * @returns Viem Address type
 */
export function ethersAddressToViem(
  address: string | undefined | null
): Address | undefined {
  if (!address) return undefined;

  // Ensure it's a valid hex address
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }

  return address as Address;
}

/**
 * Convert ethers transaction to viem TransactionRequest
 * @param tx - Ethers transaction object
 * @returns Viem TransactionRequest
 */
export function ethersTransactionToViem(tx: any): ViemTransactionRequest {
  const viemTx: ViemTransactionRequest = {};

  if (tx.to) viemTx.to = ethersAddressToViem(tx.to) as Address;
  if (tx.from) viemTx.from = ethersAddressToViem(tx.from) as Address;
  if (tx.data) viemTx.data = tx.data as Hex;
  if (tx.value) viemTx.value = ethersBigNumberToBigInt(tx.value);
  if (tx.gasLimit || tx.gas)
    viemTx.gas = ethersBigNumberToBigInt(tx.gasLimit || tx.gas);
  if (tx.gasPrice) viemTx.gasPrice = ethersBigNumberToBigInt(tx.gasPrice);
  if (tx.maxFeePerGas)
    viemTx.maxFeePerGas = ethersBigNumberToBigInt(tx.maxFeePerGas);
  if (tx.maxPriorityFeePerGas)
    viemTx.maxPriorityFeePerGas = ethersBigNumberToBigInt(
      tx.maxPriorityFeePerGas
    );
  if (tx.nonce !== undefined) viemTx.nonce = Number(tx.nonce);

  return viemTx;
}

/**
 * Convert ethers transaction receipt to viem format
 * @param receipt - Ethers transaction receipt
 * @returns Viem-compatible receipt
 */
export function ethersReceiptToViem(receipt: any): ViemTransactionReceipt {
  return {
    blockHash: receipt.blockHash as Hash,
    blockNumber: BigInt(receipt.blockNumber || 0),
    contractAddress: ethersAddressToViem(
      receipt.contractAddress
    ) as Address | null,
    cumulativeGasUsed: ethersBigNumberToBigInt(receipt.cumulativeGasUsed),
    effectiveGasPrice: ethersBigNumberToBigInt(
      receipt.effectiveGasPrice || receipt.gasPrice
    ),
    from: ethersAddressToViem(receipt.from) as Address,
    gasUsed: ethersBigNumberToBigInt(receipt.gasUsed),
    logs:
      receipt.logs?.map((log: any) => ({
        address: ethersAddressToViem(log.address) as Address,
        blockHash: log.blockHash as Hash,
        blockNumber: BigInt(log.blockNumber || 0),
        data: log.data as Hex,
        logIndex: Number(log.logIndex || 0),
        removed: Boolean(log.removed),
        topics: log.topics as Hex[],
        transactionHash: log.transactionHash as Hash,
        transactionIndex: Number(log.transactionIndex || 0),
      })) || [],
    logsBloom: receipt.logsBloom as Hex,
    status: receipt.status === 1 ? "success" : "reverted",
    to: ethersAddressToViem(receipt.to) as Address | null,
    transactionHash: receipt.transactionHash as Hash,
    transactionIndex: Number(receipt.transactionIndex || 0),
    type: (receipt.type as any) || "legacy",
  };
}

/**
 * Convert ethers hex string to viem Hex type
 * @param hex - Ethers hex string
 * @returns Viem Hex type
 */
export function ethersHexToViem(
  hex: string | undefined | null
): Hex | undefined {
  if (!hex) return undefined;

  // Ensure it starts with 0x
  if (!hex.startsWith("0x")) {
    hex = "0x" + hex;
  }

  // Validate hex format
  if (!/^0x[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`Invalid hex format: ${hex}`);
  }

  return hex as Hex;
}

/**
 * Convert ethers units to viem
 * @param value - Value in ethers format
 * @param unit - Unit name (ether, gwei, etc.)
 * @returns bigint value in wei
 */
export function ethersUnitsToViem(
  value: string | number,
  unit: string = "ether"
): bigint {
  const stringValue = value.toString();

  switch (unit.toLowerCase()) {
    case "ether":
      return parseEther(stringValue);
    case "gwei":
      return viemParseUnits(stringValue, 9);
    case "wei":
      return BigInt(stringValue);
    default:
      // Try to parse decimals from unit name
      const decimals = parseInt(unit);
      if (!isNaN(decimals)) {
        return viemParseUnits(stringValue, decimals);
      }
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Format bigint to human-readable format
 * @param value - bigint value in wei
 * @param unit - Unit to format to
 * @returns Formatted string
 */
export function formatBigInt(value: bigint, unit: string = "ether"): string {
  switch (unit.toLowerCase()) {
    case "ether":
      return formatEther(value);
    case "gwei":
      return viemFormatUnits(value, 9);
    case "wei":
      return value.toString();
    default:
      const decimals = parseInt(unit);
      if (!isNaN(decimals)) {
        return viemFormatUnits(value, decimals);
      }
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Type guard to check if value is an ethers BigNumber
 */
export function isEthersBigNumber(value: any): boolean {
  return value?._isBigNumber === true || value?.type === "BigNumber";
}

/**
 * Type guard to check if value is an ethers transaction
 */
export function isEthersTransaction(tx: any): boolean {
  return (
    tx &&
    (isEthersBigNumber(tx.gasLimit) ||
      isEthersBigNumber(tx.value) ||
      isEthersBigNumber(tx.gasPrice) ||
      tx._isBigNumber !== undefined)
  );
}

/**
 * Unified parseUnits function
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (decimals === 18) {
    return parseEther(value);
  }
  return viemParseUnits(value, decimals);
}

/**
 * Unified formatUnits function
 */
export function formatUnits(value: bigint | string, decimals: number): string {
  if (decimals === 18) {
    return formatEther(BigInt(value.toString()));
  }
  return viemFormatUnits(BigInt(value.toString()), decimals);
}

/**
 * Unified isAddress function
 */
export function isAddress(address: string): boolean {
  return viemIsAddress(address);
}

/**
 * Unified getAddress function (checksum address)
 */
export function getAddress(address: string): Hex {
  return viemGetAddress(address);
}
