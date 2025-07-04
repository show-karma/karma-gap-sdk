import { Account, Chain } from "viem";
export declare const getKernelClient: ({ account, chain, bundlerURL, paymasterURL, }: {
    account: Account;
    chain: Chain;
    bundlerURL: string;
    paymasterURL: string;
}) => Promise<import("@zerodev/sdk").KernelAccountClient<import("viem").HttpTransport<undefined, false>, Chain, import("viem/_types/account-abstraction").SmartAccount, never, undefined>>;
