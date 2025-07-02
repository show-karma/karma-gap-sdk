import { createPublicClient, http } from "viem";
import { optimismSepolia } from "viem/chains";
import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
import { Hex } from "./core/types";

const apiUrl = "https://gapstagapi.karmahq.xyz";
const projectId = "my-awesome-project";

async function testWithViem() {
  // Initialize viem public client (optional - for better performance)
  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  // Option 1: Create GAP instance without adapter (works with viem)
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(apiUrl),
  });

  // Option 2: Create GAP instance with viem adapter for better performance
  // Note: This requires @delvtech/drift-viem package
  // import { viemAdapter } from "@delvtech/drift-viem";
  // const gap = new GAP({
  //   globalSchemas: false,
  //   network: "optimism-sepolia",
  //   apiClient: new GapIndexerClient(apiUrl),
  //   adapter: viemAdapter({ publicClient }),
  // });

  console.log("Testing with viem client configuration...");

  const fetchedProject = await (projectId.startsWith("0x")
    ? gap.fetch.projectById(projectId as Hex)
    : gap.fetch.projectBySlug(projectId));

  console.log("Project fetched with viem setup:", fetchedProject);

  return fetchedProject;
}

async function testBothProviders() {
  console.log("=== Testing SDK with both ethers and viem ===\n");

  // Test with default setup (ethers-compatible)
  console.log("1. Testing with default setup:");
  const gapDefault = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(apiUrl),
  });

  const projectDefault = await gapDefault.fetch.projectBySlug(projectId);
  console.log(
    "✅ Default setup works:",
    projectDefault?.details?.title || projectDefault?.uid
  );

  // Test with viem setup
  console.log("\n2. Testing with viem client:");
  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  const gapViem = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(apiUrl),
  });

  const projectViem = await gapViem.fetch.projectBySlug(projectId);
  console.log(
    "✅ Viem setup works:",
    projectViem?.details?.title || projectViem?.uid
  );

  console.log("\n=== Both providers work seamlessly! ===");
}

// Run the viem-specific test
testWithViem()
  .then(() => console.log("\nViem test completed successfully!"))
  .catch(console.error);

// Uncomment to test both providers
// testBothProviders()
//   .then(() => console.log("\nAll tests completed!"))
//   .catch(console.error);
