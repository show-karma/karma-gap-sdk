"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKernelClient = void 0;
const sdk_1 = require("@zerodev/sdk");
const viem_1 = require("viem");
const getKernelClient = async ({ account, chain, bundlerURL, paymasterURL, }) => {
    const paymasterClient = (0, sdk_1.createZeroDevPaymasterClient)({
        chain,
        transport: (0, viem_1.http)(paymasterURL),
    });
    const kernelClient = (0, sdk_1.createKernelAccountClient)({
        account,
        chain,
        bundlerTransport: (0, viem_1.http)(bundlerURL),
        paymaster: {
            getPaymasterData(userOperation) {
                return paymasterClient.sponsorUserOperation({ userOperation });
            },
        },
    });
    return kernelClient;
};
exports.getKernelClient = getKernelClient;
