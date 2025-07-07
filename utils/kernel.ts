import { KernelAccountClient, KernelEIP1193Provider } from "@zerodev/sdk";
import { ethers } from "ethers";

export const kernelToEthersSigner = async (
  kernelClient: KernelAccountClient
) => {
  const kernelProvider = new KernelEIP1193Provider(kernelClient);

  // Use the KernelProvider with ethers
  const ethersProvider = new ethers.BrowserProvider(kernelProvider);
  const signer = await ethersProvider.getSigner();
  return signer;
};
