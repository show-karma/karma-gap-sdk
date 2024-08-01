import { Networks } from "../consts";
import { ethers } from "ethers";

const providers: Record<number, ethers.JsonRpcProvider> = {};

export const getWeb3Provider = (chainId: number): ethers.JsonRpcProvider => {
  const rpcUrl = Object.values(Networks).find((n) => n.chainId === chainId)
    ?.rpcUrl;

  if (!rpcUrl) {
    throw new Error(`No rpcUrl found for chainId ${chainId}`);
  }

  if (!providers[chainId]) {
    providers[chainId] = new ethers.JsonRpcProvider(rpcUrl);
  }
  return providers[chainId];
};
