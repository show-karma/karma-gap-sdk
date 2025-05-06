"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const send_gelato_txn_1 = require("./send-gelato-txn");
const assertionObj = [
    {
        data: /0x[a-fA-F0-9]+/gim,
        chainId: /\d+/,
        target: /0x[a-fA-F0-9]{40}/gim,
    },
    /\{apiKey\}/,
    {
        retries: /\d+/,
    },
];
function assert(body) {
    if (!Array.isArray(body) || body.length !== assertionObj.length)
        throw new Error("Invalid request body");
    assertionObj.forEach((item, index) => {
        // check if objects from assertion Object are present in body
        // and test them using the regexp from the assertion Object
        if (typeof item === "object") {
            Object.entries(item).forEach(([key, value]) => {
                if (!body[index][key]?.toString().match(value))
                    throw new Error("Invalid request body");
            });
        }
        // test other items as strings
        else if (!body[index]?.toString().match(item))
            throw new Error("Invalid request body");
    });
    return true;
}
async function handler(req, res, env_gelatoApiKey) {
    if (req.method !== "POST") {
        res.statusCode = 405;
        res.send("Method not allowed");
        return;
    }
    try {
        const body = req.body;
        if (!assert(body))
            return;
        const { [env_gelatoApiKey]: apiKey } = process.env;
        if (!apiKey)
            throw new Error("Api key not provided.");
        body[1] = apiKey;
        const result = await send_gelato_txn_1.Gelato.sendByApiKey(...body);
        const txId = await result.wait();
        res.send(txId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        res.statusCode = 400;
        res.send(error.message);
    }
}
exports.handler = handler;
