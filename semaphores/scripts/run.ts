import "dotenv/config";
import { isAddress, ethers, isHexString } from "ethers";
import { Networks } from "../../core/consts";
import axios from "axios";
import crypto from "crypto";

const [, , fileName, communityUID] = process.argv;

const ChainID = {
  "optimism-sepolia": 11155420,
};

const networkName = "optimism-sepolia";
const gapAPI = "http://localhost:3002";

//////////////////////////////////////////////////////////////////////////////////////////////////
const network: keyof typeof ChainID = networkName;

/**
 * web3 provider to build wallet and sign transactions
 */
const web3 = new ethers.JsonRpcProvider(
  Networks[network as keyof typeof Networks].rpcUrl
);

/**
 * Wallet to sign transactions
 */
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", web3);

async function createGroup() {
  // Eg. Pokt Network
  const communityUID =
    "0xf883202155cb46d2e8fa3bae962aa65b653ca2939b87d55e22b77a9ad74ffea7";
  const groupType = "grantees"; // Could be delegates, grantees, etc.
  // Create a hash of the community UID and group type
  const groupHash = crypto
    .createHash("sha256")
    .update(`${communityUID}-${groupType}`)
    .digest("hex");

  // Get the group members
  const members = await axios.get(
    `${gapAPI}/communities/pokt-network/grantees`
  );

  // TODO: Create a group

  // TODO: Add Members
}

createGroup();
