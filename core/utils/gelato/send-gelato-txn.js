"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gelato = exports.sendGelatoTxn = void 0;
const axios_1 = __importDefault(require("axios"));
const relay_sdk_1 = require("@gelatonetwork/relay-sdk");
const watch_gelato_txn_1 = require("./watch-gelato-txn");
const GAP_1 = require("../../class/GAP");
async function sendByUrl(...params) {
    const { data } = await axios_1.default.post(GAP_1.GAP.gelatoOpts.sponsorUrl, params);
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
async function sendByApiKey(...params) {
    const { apiKey } = GAP_1.GAP?.gelatoOpts || {};
    if (!apiKey && params[1] === "{apiKey}")
        throw new Error("No api key provided.");
    if (apiKey && params[1] === "{apiKey}")
        params[1] = apiKey;
    const client = new relay_sdk_1.GelatoRelay();
    const relayResponse = await client.sponsoredCall(...params);
    return {
        taskId: relayResponse.taskId,
        /**
         * Waits for the transaction to be confirmed by Gelato.
         * @returns Txn id
         */
        wait: () => (0, watch_gelato_txn_1.watchGelatoTxn)(relayResponse.taskId),
    };
}
/**
 * Sends a sponsored call using GelatoRelay
 * @param payload
 * @returns txn hash
 */
async function sendGelatoTxn(...params) {
    if (!GAP_1.GAP.gelatoOpts)
        throw new Error("Gelato opts not set.");
    const { env_gelatoApiKey, sponsorUrl, useGasless } = GAP_1.GAP.gelatoOpts;
    if (!useGasless)
        throw new Error("Gasless is not enabled.");
    if (sponsorUrl && env_gelatoApiKey) {
        return sendByUrl(...params);
    }
    const { wait } = await sendByApiKey(...params);
    return wait();
}
exports.sendGelatoTxn = sendGelatoTxn;
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
data, chainId, target) {
    return [
        {
            data,
            chainId,
            target,
        },
        "{apiKey}",
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
exports.Gelato = Gelato;
