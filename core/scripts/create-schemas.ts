import { EAS, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';
import keys from "../../config/keys.json";
import { Networks, zeroAddress } from "../consts";
import { resolve } from "path";

const schemaRegistryContractAddress = "0x4200000000000000000000000000000000000020";

(async () => {
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

const web3 = new ethers.JsonRpcProvider("https://lisk.drpc.org");
const wallet = new ethers.Wallet(keys.privateKey, web3);
schemaRegistry.connect(wallet);

const allSchemas = [
{
  name: "Project",
  schema: "bool project",
  resolver: "0x6dC1D6b864e8BEf815806f9e4677123496e12026"
},
  {
  name: "Community",
  schema: "bool community",
  resolver: "0xfddb660F2F1C27d219372210745BB9f73431856E"
},
{
  name: "Details",
  schema: "string json",
  resolver: "0xd2eD366393FDfd243931Fe48e9fb65A192B0018c"
},
{
  name: "Grant",
  schema: "bytes32 communityUID",
  resolver: "0xd2eD366393FDfd243931Fe48e9fb65A192B0018c"
},
{
  name: "GrantVerified",
  schema: "string type, string reason",
  resolver: "0x04D6BB799f5A8c76882C4372d1FC39Cd0DDA0A4c"
},
{
  name: "MemberOf",
  schema: "bool memberOf",
  resolver: "0xd2eD366393FDfd243931Fe48e9fb65A192B0018c"
},
{
    name: "ContributorProfile",
    schema: "string json",
    resolver: "0x0ab840273E4Ab6Dc642D02102Db719e1c1e3B299"
  }
];

for(const schema of allSchemas) {
    const transaction = await schemaRegistry.register({
    schema: schema.schema,
    resolverAddress: schema.resolver,
    revocable: true,
    }
    );

    const response = await transaction.wait();
    console.log(`Schema ${schema.name} registered with UID: ${response}`);
}
})();