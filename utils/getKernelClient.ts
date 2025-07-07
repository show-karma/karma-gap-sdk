import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { Account, Chain, http } from "viem";

export const getKernelClient = async ({
  account,
  chain,
  bundlerURL,
  paymasterURL,
}: {
  account: Account;
  chain: Chain;
  bundlerURL: string;
  paymasterURL: string;
}) => {
  const paymasterClient = createZeroDevPaymasterClient({
    chain,
    transport: http(paymasterURL),
  });

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(bundlerURL),
    paymaster: {
      getPaymasterData(userOperation) {
        return paymasterClient.sponsorUserOperation({ userOperation });
      },
    },
  });

  return kernelClient;
};
