import { AlloRegistry } from "../class/GrantProgramRegistry/AlloRegistry";
import { ethers } from "ethers";
import { Networks } from "../consts";

import keys from "../../config/keys.json";

const networkName = "sepolia";
const web3 = new ethers.JsonRpcProvider(Networks[networkName].rpcUrl);
const wallet = new ethers.Wallet(keys.privateKey, web3);
const signer = wallet.connect(web3);

export async function main() {
  const alloRegistry = new AlloRegistry(signer, keys.ipfsToken);

  const nonce = 12310;
  const name = "Karma Gap Registry";
  const metadata = {
    title: name,
    description: `Karma Gap Registry`,
    website: "gap.karmahq.xyz",
    projectTwitter: "karmahq_",
    logoImg: "gap.karmahq.xyz/logo/karma-gap-logo.svg",
    bannerImg: "gap.karmahq.xyz/logo/karma-gap-logo.svg",
    logoImgData: {},
    bannerImgData: {},
    credentials: {},
    createdAt: new Date().getTime(),

    type: "program",
  };
  const owner = await signer.getAddress();

  const response = await alloRegistry.createProgram(
    nonce,
    metadata.title,
    metadata,
    owner,
    [owner]
  );
  console.log(response);
}

main();
