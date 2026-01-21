import { EASNetworkConfig, TNetwork } from "../types";
import { MountEntities, Networks, zeroAddress } from "../consts";

import SchemaRegistry from "../abi/SchemaRegistry.json";

import { ethers } from "ethers";

import keys from "../../config/keys.json";
import { GapSchema } from "../class/GapSchema";
import { writeFileSync } from "fs";
import "dotenv/config";

// Read RPC URL from environment variable for sepolia (default network)
const defaultNetwork = "sepolia";
const envVarName = `RPC_${defaultNetwork.toUpperCase().replace(/-/g, "_")}`;
const rpcUrl = process.env[envVarName];
if (!rpcUrl) {
  throw new Error(`RPC URL not found. Set ${envVarName} environment variable.`);
}

const web3 = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(keys.privateKey, web3);

const contract = new ethers.Contract(
  Networks.sepolia.contracts.schema,
  SchemaRegistry.abi,
  wallet
);

async function deploy(networkName?: TNetwork) {
  const [, , $3] = process.argv;
  const network = Networks[networkName || $3] as EASNetworkConfig;
  const key = keys[networkName || $3];

  if (!(networkName || $3)) throw new Error("Network name is required");
  if (!network) {
    throw new Error(
      `Invalid network name. Supported networks are: ${Object.keys(
        Networks
      ).join(", ")}`
    );
  }
  if (!key) throw new Error("No keys found for this network");

  const revocable = true;

  const promises = Object.values(MountEntities(Networks.sepolia))
    .slice(0, 1)
    .map((entity) => {
      return contract.register(
        new GapSchema(entity, {} as any).raw,
        zeroAddress,
        revocable,
        {
          gasLimit: 5000000n,
        }
      );
    });
  const results: any[] = [];
  for (const tx of promises) {
    const txn = await tx;
    const result = await txn.wait();
    results.push(result);
  }
  console.log(results);
  writeFileSync(
    `schemas/GAP-schemas-${Date.now()}.json`,
    JSON.stringify(results, null, 2)
  );
}

if (process.argv[1].includes("core/scripts/deploy.ts")) deploy();

export { deploy };
