import { AlloRegistry } from "../class/GrantProgramRegistry/AlloRegistry";
import { ethers } from "ethers";
import keys from "../../config/keys.json";
import "dotenv/config";

const networkName = "sepolia";

// Read RPC URL from environment variable
const rpcUrl = process.env[`RPC_${networkName.toUpperCase().replace("-", "_")}`];
if (!rpcUrl) {
  throw new Error(`RPC URL not found. Set RPC_${networkName.toUpperCase().replace("-", "_")} environment variable.`);
}

const web3 = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(keys.privateKey, web3);
const signer = wallet.connect(web3);

export async function main() {
  const alloRegistry = new AlloRegistry(signer);

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

  const metadataCid = ""; // TODO: provide metadata CID
  const response = await alloRegistry.createProgram(
    nonce,
    metadata.title,
    metadataCid,
    owner,
    [owner]
  );
  console.log(response);
}

main();
