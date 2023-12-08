import { Networks } from '../consts';
import { ethers } from 'ethers';

const providers: Record<number, ethers.providers.JsonRpcProvider> = {};

export const getWeb3Provider = (
  chainId: number
): ethers.providers.JsonRpcProvider => {
  const rpcUrl = Object.values(Networks).find((n) => n.chainId === chainId)
    ?.rpcUrl;

  if (!rpcUrl) {
    throw new Error(`No rpcUrl found for chainId ${chainId}`);
  }

  if (!providers[chainId]) {
    providers[chainId] = new ethers.providers.JsonRpcProvider(rpcUrl);
  }
  return providers[chainId];
};
