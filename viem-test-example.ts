import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";
import { createWalletClient, http } from "viem";
import { GAP } from "./core/class/GAP";
import { GapIndexerClient, Project } from "./core/class";
import { ProjectDetails } from "./core/class/types/attestations";
import "dotenv/config";

const privateKey = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(privateKey as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: optimismSepolia,
  transport: http("https://opt-sepolia.g.alchemy.com/v2/duRh1PCchyub9TDtSaus4"),
});
const API_URL = "https://gapstag.karmahq.xyz";

const viemTest = async () => {
  const gap = new GAP({
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(API_URL),
  });

  const project = new Project({
    data: {
      project: true,
    },
    schema: gap.findSchema("Project"),
    recipient: walletClient.account?.address,
  });
  project.details = new ProjectDetails({
    data: {
      title: "Test VIEM Project",
      description: "Test VIEM Description",
      imageURL: "https://via.placeholder.com/150",
      slug: "test-viem-project",
    },
    schema: gap.findSchema("ProjectDetails"),
    recipient: walletClient.account?.address,
  });
  const projectTx = await project.attest(walletClient);
  console.log(projectTx);
};

viemTest();
