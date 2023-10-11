import axios from "axios";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { watchGelatoTxn } from "./watch-gelato-txn";
import { GAP } from "../../class/GAP";
import { Hex } from "../../types";

async function sendByUrl(...params: Parameters<GelatoRelay["sponsoredCall"]>) {
  const { data } = await axios.post<string>(GAP.gelatoOpts.sponsorUrl, params);
  return data;
}

/**
 * Send gelato using an explicit api key.
 *
 * > __This is not safe in the frontend.__
 *
 * @param params
 * @returns Gelato's task id and a wait function.
 */
async function sendByApiKey(
  ...params: Parameters<GelatoRelay["sponsoredCall"]>
) {
  const { apiKey } = GAP?.gelatoOpts || {};

  if (!apiKey && params[1] === "{apiKey}")
    throw new Error("No api key provided.");

  if (apiKey && params[1] === "{apiKey}") params[1] = apiKey;

  const client = new GelatoRelay();
  const relayResponse = await client.sponsoredCall(...params);

  return {
    taskId: relayResponse.taskId,
    /**
     * Waits for the transaction to be confirmed by Gelato.
     * @returns Txn id
     */
    wait: () => watchGelatoTxn(relayResponse.taskId),
  };
}

/**
 * Sends a sponsored call using GelatoRelay
 * @param payload
 * @returns txn hash
 */
async function sendGelatoTxn(
  ...params: Parameters<GelatoRelay["sponsoredCall"]>
) {
  if (!GAP.gelatoOpts) throw new Error("Gelato opts not set.");
  const { env_gelatoApiKey, sponsorUrl, useGasless, contained } =
    GAP.gelatoOpts;

  if (!useGasless) throw new Error("Gasless is not enabled.");

  if (
    (sponsorUrl && contained && env_gelatoApiKey) ||
    (sponsorUrl && !contained)
  ) {
    return sendByUrl(...params);
  }

  const { wait } = await sendByApiKey(...params);
  return wait();
}

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
function buildArgs(
  /**
   * Populated transaction data.
   */
  data: string,
  chainId: bigint,
  target: Hex
): Parameters<GelatoRelay["sponsoredCall"]> {
  return [
    {
      data,
      chainId,
      target,
    },
    "{apiKey}", // filled in the api
    {
      retries: 3,
    },
  ];
}

const Gelato = {
  sendByApiKey,
  sendByUrl,
  buildArgs,
};

export { sendGelatoTxn, Gelato };
