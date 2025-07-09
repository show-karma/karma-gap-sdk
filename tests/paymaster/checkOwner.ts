import { GAP } from "../../core/class/GAP";
import { GapIndexerClient } from "../../core/class/karma-indexer/GapIndexerClient";
import { createPublicClient, http } from "viem";
import { optimismSepolia } from "viem/chains";
import "dotenv/config";

const API_URL = "https://gapstagapi.karmahq.xyz";

const checkOwner = async () => {
  const address = "paste-your-address-here";
  const projectId = "paste-your-project-id-here";

  const rpcClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(
      "https://opt-sepolia.g.alchemy.com/v2/duRh1PCchyub9TDtSaus4"
    ),
  });

  const gap = new GAP({
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });
  const projectInstance = await gap.fetch.projectBySlug(projectId);

  const [isOwnerResult, isAdminResult] = await Promise.all([
    projectInstance?.isOwner(rpcClient as any, address).catch((error) => {
      console.log(error);
      return false;
    }),
    projectInstance?.isAdmin(rpcClient as any, address).catch((error) => {
      console.log(error);
      return false;
    }),
  ]);

  console.log(`${address} is owner: ${isOwnerResult}`);
  console.log(`${address} is admin: ${isAdminResult}`);
};

checkOwner();
