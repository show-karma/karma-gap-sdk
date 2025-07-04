"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kernelToEthersSigner = void 0;
const sdk_1 = require("@zerodev/sdk");
const ethers_1 = require("ethers");
const kernelToEthersSigner = async (kernelClient) => {
    const kernelProvider = new sdk_1.KernelEIP1193Provider(kernelClient);
    // Use the KernelProvider with ethers
    const ethersProvider = new ethers_1.ethers.BrowserProvider(kernelProvider);
    const signer = await ethersProvider.getSigner();
    return signer;
};
exports.kernelToEthersSigner = kernelToEthersSigner;
