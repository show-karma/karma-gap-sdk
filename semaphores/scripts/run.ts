import "dotenv/config";
import { isAddress, ethers, isHexString } from "ethers";
import { Networks } from "../../core/consts";
import axios from "axios";

// Configure the network and API
const networkName = "optimism-sepolia";
const gapAPI = "http://localhost:3002";

const network: string = networkName;
const chainID: number = Networks[networkName].chainId;
const provider = new ethers.JsonRpcProvider(Networks[networkName].rpcUrl);

/**
 * Wallet to sign transactions
 */
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

async function main() {
  const communityUID =
    "0xf883202155cb46d2e8fa3bae962aa65b653ca2939b87d55e22b77a9ad74ffea7"; // Eg. Pokt Network
  const scope = "grantees"; // Eg. grantees, delegates
  // Get the group
  const group = await axios.get(
    `${gapAPI}/semaphores/group?chainID=${chainID}&communityUID=${communityUID}&scope=${scope}`
  );

  console.log("Group", group);

  // Create a new group if it doesn't exist
  if (!group.data) {
    const createdGroup = await axios.post(
      `${gapAPI}/semaphores/group?chainID=${chainID}&communityUID=${communityUID}&scope=${scope}`
    );
    console.log("Created Group", createdGroup);
  }

  // TODO: Add members to the group

  // TODO: Update root
}

main();
