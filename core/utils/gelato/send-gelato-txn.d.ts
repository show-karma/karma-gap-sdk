import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { Hex } from "../../types";
declare function sendByUrl(...params: Parameters<GelatoRelay["sponsoredCall"]>): Promise<string>;
/**
 * Send gelato using an explicit api key.
 *
 * > __This is not safe in the frontend.__
 *
 * @param params
 * @returns Gelato's task id and a wait function.
 */
declare function sendByApiKey(...params: Parameters<GelatoRelay["sponsoredCall"]>): Promise<{
    taskId: string;
    /**
     * Waits for the transaction to be confirmed by Gelato.
     * @returns Txn id
     */
    wait: () => Promise<string>;
}>;
/**
 * Sends a sponsored call using GelatoRelay
 * @param payload
 * @returns txn hash
 */
declare function sendGelatoTxn(...params: Parameters<GelatoRelay["sponsoredCall"]>): Promise<string>;
/**
 * Builds the arguments for a sponsored call using GelatoRelay
 * @param data Populated contract call.
 * @param chainId
 * @param target target contract address (Hex)
 *
 * @example
 *
 * ```ts
 * const { data } = await contract.populateTransaction.transfer(
 *  recipient,
 *  amount
 * );
 * const args = buildArgs(data, chainId, target);
 * const txn = sendGelatoTxn(...args);
 * console.log(txn) // 0xabc..
 * ```
 */
declare function buildArgs(
/**
 * Populated transaction data.
 */
data: string, chainId: bigint, target: Hex): Parameters<GelatoRelay["sponsoredCall"]>;
declare const Gelato: {
    sendByApiKey: typeof sendByApiKey;
    sendByUrl: typeof sendByUrl;
    buildArgs: typeof buildArgs;
};
export { sendGelatoTxn, Gelato };
