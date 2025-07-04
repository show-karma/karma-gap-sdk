import { KernelAccountClient } from "@zerodev/sdk";
import { ethers } from "ethers";
export declare const kernelToEthersSigner: (kernelClient: KernelAccountClient) => Promise<ethers.JsonRpcSigner>;
