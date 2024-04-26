import { AlloRegistry } from "../class/GrantProgramRegistry/AlloRegistry";
import { ethers } from "ethers";
import { Networks } from "../consts";
import { NFTStorage } from "nft.storage";
import keys from "../../config/keys.json";

const networkName = "sepolia"; // Only supported on testnet sepolia (indexer setup)
const web3 = new ethers.JsonRpcProvider(Networks[networkName].rpcUrl);
const wallet = new ethers.Wallet(keys.privateKey, web3);
const signer = wallet.connect(web3);

export async function main() {
  const ipfsStorage = new NFTStorage({
    token: keys.ipfsToken,
  });

  const alloRegistry = new AlloRegistry(signer, ipfsStorage);

  const nonce = 3;
  const name = "Karma Test Program 3";
  const metadata = {
    title: name,
    description: `Karma Test Program 3: This is a test program 3 to test the functionality of the Karma platform.`,
    website: "https://karma.fund",
    projectTwitter: "karma_fund",
    logoImg: "bafkreigf5egjxs3zbafr4d24kj5tf7idktfjc737xolx5h6dj7hnf77nde",
    bannerImg: "bafkreid5rccqi6q4xgv4cj5ofrzfmswf7fn2525e5hducvh3r56lstoi74",
    logoImgData: {},
    bannerImgData: {},
    credentials: {},
    createdAt: new Date().getTime(),

    // TODO: Additional metadata
    category: "dapps",
    source: "grant-program-registry",
  };
  const owner = wallet.address;

  const response = await alloRegistry.createProgram(
    nonce,
    name,
    metadata,
    owner,
    [owner]
  );
  console.log(response);
}

main();
