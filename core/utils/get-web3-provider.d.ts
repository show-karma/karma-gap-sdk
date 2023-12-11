import { ethers } from 'ethers';
declare const providers: Record<number, ethers.providers.JsonRpcProvider>;
export declare const getWeb3Provider: (chainId: number) => ethers.providers.JsonRpcProvider;
export {};
