import { GAP } from "./core/class/GAP";
import { GapIndexerClient } from "./core/class/karma-indexer/GapIndexerClient";
import { Hex } from "./core/types";

const apiUrl = "https://gapstagapi.karmahq.xyz";
const projectId = "my-awesome-project";

async function test() {
  // const indexer = new GapIndexerApi('https://gapstagapi.karmahq.xyz');
  const gap = new GAP({
    globalSchemas: false,
    network: "optimism-sepolia",
    apiClient: new GapIndexerClient(apiUrl),
  });

  const fetchedProject = await (projectId.startsWith("0x")
    ? gap.fetch.projectById(projectId as Hex)
    : gap.fetch.projectBySlug(projectId));

  console.log(fetchedProject);

  return fetchedProject;
}

test();
