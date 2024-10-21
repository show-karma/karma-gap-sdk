import { GAP } from "../../core";
import { GapIndexerClient } from "../../core/class";
import { ethers } from "ethers";
import { Networks } from "../consts";

import keys from "../../config/keys.json";

export async function revokeAttestation() {
  const gap = new GAP({
    network: "optimism-sepolia", // Change the newtwork here
    apiClient: new GapIndexerClient("https://gapstagapi.karmahq.xyz"), // Change to prod api
  });

  const web3 = new ethers.JsonRpcProvider(Networks.optimism.rpcUrl);
  const wallet = new ethers.Wallet(keys.privateKey, web3);
  const signer = wallet.connect(web3);

  const project = await gap.fetch.projectById(
    "0x24e0986a309e5385dfb2ee2bf230b0a62e942ead8fef6171feb9de21b6d6fe8a" // Project UID
  );
  console.log(project.pointers);

  const projectPointers = project.pointers;
  const pointerToRevoke = projectPointers.find(
    (pointer) =>
      pointer.uid ===
      "0x7542b7216ea4f82dffeac48922e64b70b240a0b95706aaa745876c5d33349133" // Pointer UID which needs to be revoked
  );

  try {
    if (pointerToRevoke) {
      await pointerToRevoke.revoke(signer);
      console.log("Revoked pointer");
    }
  } catch (error) {
    console.log(error);
  }
}

revokeAttestation();
