import { AlloRegistry } from "../class/GrantProgramRegistry/AlloRegistry";
import { ethers } from "ethers";
import { Networks } from "../consts";
import { NFTStorage } from "nft.storage";
import keys from "../../config/keys.json";

const networkName = "sepolia"; // Only supported on testnet sepolia (indexer setup)
// const web3 = new ethers.JsonRpcProvider(Networks[networkName].rpcUrl);
// const wallet = new ethers.Wallet(keys.privateKey, web3);
// const signer = wallet.connect(web3);

export async function main(metadata: any, nonce: number, ipfsToken: string, signer: ethers.Wallet) {
  const ipfsStorage = new NFTStorage({
    token: keys.ipfsToken,
  });

  const alloRegistry = new AlloRegistry(signer, ipfsStorage);

  // const nonce = 12310;
  // const name = "Karma Test Program #011";
  // const metadata = {
  //   title: name,
  //   description: `Karma Test Program #011`,
  //   website: "https://karma.fund#011",
  //   projectTwitter: "karma_fund11",
  //   logoImg: "bafkreigf5egjxs3zbafr4d24kj5tf7idktfjc737xolx5h6dj7hnf77ndea",
  //   bannerImg: "bafkreid5rccqi6q4xgv4cj5ofrzfmswf7fn2525e5hducvh3r56lstoi74a",
  //   logoImgData: {},
  //   bannerImgData: {},
  //   credentials: {},
  //   createdAt: new Date().getTime(),

    // TODO: Additional metadata
    // category: "dapps",
    // source: "grant-program-registry",
    // ownerBoss: "arthur"
  // };
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

// main();
