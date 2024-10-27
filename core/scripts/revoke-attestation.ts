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

  const web3 = new ethers.JsonRpcProvider(Networks["optimism-sepolia"].rpcUrl); // Change the network here
  const wallet = new ethers.Wallet(keys.privateKey, web3);
  const signer = wallet.connect(web3);

  const project = await gap.fetch.projectById(
    "0xf260da0d8a62cd36a4b47970d8c41a0af144906d52c2576212b638abe461e8fb" // Project UID which is wrongly linked
  );
  console.log(project.pointers);

  const projectPointers = project.pointers;
  const pointerToRevoke = projectPointers.find(
    (pointer) =>
      pointer.uid ===
      "0xe8c0be759ae6861ac99ce80587ab54346c48f0c4ee50d85ba6b9a3ce4eeb196f" // Pointer UID which needs to be revoked
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
