import { AlloBase } from "../class/GrantProgramRegistry/Allo";
import { ethers } from "ethers";
import { Networks } from "../consts";
import { NFTStorage } from "nft.storage";
import { ApplicationMetadata, RoundMetadata } from "../class/types/allo";
import keys from "../../config/keys.json";
import { AlloContracts } from "../consts";
import { GrantArgs, Address } from "../class/types/allo";

const networkName = "sepolia";
const chainId = Networks[networkName].chainId;
const web3 = new ethers.JsonRpcProvider(Networks[networkName].rpcUrl);
const wallet = new ethers.Wallet(keys.privateKey, web3);
const signer = wallet.connect(web3);

export async function main() {
  const ipfsStorage = new NFTStorage({
    token: keys.ipfsToken,
  });

  const allo = new AlloBase(signer, ipfsStorage, chainId);

  const _currentTimestamp = (await signer?.provider?.getBlock(
    await signer?.provider?.getBlockNumber()
  ))!.timestamp;
  const owner = wallet.address;

  const profileId =
    "0x3d31867b85ca316e0e0b129f8b4d545c4926aac7e4745ce584de923e7e5e4116"; // Karma Test Program 2
  const matchinFundAmount = 0;
  const roundMetadata: RoundMetadata = {
    name: "Test Round 1",
    support: {
      info: "Email",
      type: "mahesh@karmahq.xyz",
    },
    roundType: "public",
    eligibility: {
      description:
        "This is a test round using Karma Test Program 2 on allo-v2 for grant-program-registry.",
      requirements: [
        {
          requirement: "Be awesome!",
        },
      ],
    },
    feesAddress: "",
    feesPercentage: 0,
    programContractAddress: "0x0613fc8c28ca79d110a104c274b2d1eacef52355", // Some Contract Address
  };
  const applicationMetadata: ApplicationMetadata = {
    version: "1.0.0",
    lastUpdatedOn: new Date().getTime(),
    applicationSchema: {
      questions: [
        {
          id: 0,
          info: "Email Address",
          type: "email",
          title: "Email Address",
          hidden: false,
          required: true,
          encrypted: false,
        },
      ],
      requirements: {
        github: {
          required: false,
          verification: false,
        },
        twitter: {
          required: false,
          verification: false,
        },
        // Potentially add more requirements here if they exist in the data
      },
    },
  };

  const args: GrantArgs = {
    profileId,
    roundMetadata,
    applicationStart: _currentTimestamp + 3600, // 1 hour later   registrationStartTime
    applicationEnd: _currentTimestamp + 432000, // 5 days later   registrationEndTime
    roundStart: _currentTimestamp + 7200, // 2 hours later  allocationStartTime
    roundEnd: _currentTimestamp + 864000, // 10 days later  allocaitonEndTime
    matchingFundAmt: matchinFundAmount,
    applicationMetadata,
    managers: [owner as Address], // managers
    strategy: AlloContracts.strategy
      .DonationVotingMerkleDistributionDirectTransferStrategy as Address, // strategy
    payoutToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Eg. ETH
  };

  const response = await allo.createGrant(args);
  console.log(response);
}

main();
