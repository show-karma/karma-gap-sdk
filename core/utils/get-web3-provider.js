"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeb3Provider = void 0;
const consts_1 = require("../consts");
const ethers_1 = require("ethers");
const providers = {};
const getWeb3Provider = (chainId) => {
    const rpcUrl = Object.values(consts_1.Networks).find((n) => n.chainId === chainId)
        ?.rpcUrl;
    if (!rpcUrl) {
        throw new Error(`No rpcUrl found for chainId ${chainId}`);
    }
    if (!providers[chainId]) {
        providers[chainId] = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    }
    return providers[chainId];
};
exports.getWeb3Provider = getWeb3Provider;
