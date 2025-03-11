// /* eslint-disable no-shadow */
// /* eslint-disable no-promise-executor-return */
// /* eslint-disable no-await-in-loop */
// /* eslint-disable id-length */
// /* eslint-disable class-methods-use-this */
// /* eslint-disable no-useless-constructor */
// /* eslint-disable import/no-extraneous-dependencies */
// import { GelatoRelay } from "@gelatonetwork/relay-sdk";
// import { ethers } from "ethers";
// import axios from "axios";
// import ABI from "./";
// import { Hex } from "core/types";
// enum TaskState {
//   CheckPending = "CheckPending",
//   ExecPending = "ExecPending",
//   ExecSuccess = "ExecSuccess",
//   ExecReverted = "ExecReverted",
//   WaitingForConfirmation = "WaitingForConfirmation",
//   Blacklisted = "Blacklisted",
//   Cancelled = "Cancelled",
//   NotFound = "NotFound",
// }
// export class DelegateRegistryContract extends GelatoRelay {
//   contract: ethers.Contract;
//   constructor(readonly contractAddress: Hex) {
//     super();
//     this.contract = new ethers.Contract(contractAddress, ABI);
//   }
//   /**
//    * Returns the r, s, v values of a signature
//    * @param signature
//    * @returns
//    */
//   private getRSV(signature: string) {
//     const r = signature.slice(0, 66);
//     const s = `0x${signature.slice(66, 130)}`;
//     const v = `0x${signature.slice(130, 132)}`;
//     return { r, s, v };
//   }
//   /**
//    * Returns the nonce of a delegate
//    * @param address
//    * @returns
//    */
//   async getNonce(address: Hex) {
//     const nonce = <bigint>await readFn({
//       abi: ABI,
//       address: this.contractAddress,
//       functionName: "nonces",
//       args: [address],
//       chainId: 10,
//     });
//     return {
//       nonce: Number(nonce),
//       next: Number(nonce + 1n),
//     };
//   }
//   /**
//    * Waits for a transaction to be mined at Gelato Network
//    * @param taskId
//    * @returns
//    */
//   wait(taskId: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const loop = async () => {
//         const oneSecond = 1;
//         while (oneSecond) {
//           const status = await this.getTaskStatus(taskId);
//           // print status :D so we can debug this for now
//           // eslint-disable-next-line no-console
//           console.log(status);
//           if (!status) {
//             reject(new Error("Transaction goes wrong."));
//             break;
//           }
//           if (status && status.taskState === TaskState.ExecSuccess) {
//             resolve(status.transactionHash || "");
//             break;
//           } else if (
//             [
//               TaskState.Cancelled,
//               TaskState.ExecReverted,
//               TaskState.Blacklisted,
//             ].includes(status?.taskState)
//           ) {
//             reject(
//               new Error(
//                 status.lastCheckMessage
//                   ?.split(/(RegisterDelegate)|(Execution error): /)
//                   .at(-1) || ""
//               )
//             );
//             break;
//           }
//           await new Promise((r) => setTimeout(r, 500));
//         }
//       };
//       loop();
//     });
//   }
//   /**
//    * Executes a transaction on the DelegateRegistry contract
//    * @param fn the function to call
//    * @param args the arguments to pass to the function
//    * @returns the transaction hash and a wait function to wait for the transaction to be mined
//    */
//   public async transaction(fn: string, args: unknown[]) {
//     const { hash } = await writeFn({
//       abi: ABI,
//       address: this.contractAddress,
//       functionName: fn,
//       args,
//       chainId: 10,
//     });
//     return {
//       hash,
//       wait: () => waitForTransaction({ hash }),
//     };
//   }
//   public async registerDelegate(data: DelegateWithProfile) {
//     return this.transaction("registerDelegate", [
//       data.tokenAddress,
//       BigInt(data.tokenChainId),
//       JSON.stringify(data.profile),
//     ]);
//   }
//   /**
//    * Creates the payload for register delegate by signature
//    * returning the payload
//    * @param data
//    * @returns
//    */
//   public async registerDelegateBySig(
//     address: Hex,
//     data: DelegateWithProfile
//   ): Promise<Parameters<GelatoRelay["sponsoredCall"]>> {
//     const { nonce } = await this.getNonce(address);
//     // 2 minutes expiry
//     const expiry = ((Date.now() + 1000 * 120) / 1000).toFixed(0);
//     const metadata = JSON.stringify(data.profile);
//     const types = {
//       RegisterDelegate: [
//         { name: "tokenAddress", type: "address" },
//         { name: "tokenChainId", type: "uint256" },
//         { name: "metadata", type: "string" },
//         { name: "nonce", type: "uint256" },
//         { name: "expiry", type: "uint256" },
//       ],
//     } as const;
//     const signature = await signTypedData({
//       message: {
//         tokenAddress: data.tokenAddress,
//         tokenChainId: BigInt(data.tokenChainId),
//         metadata,
//         nonce,
//         expiry,
//       },
//       domain: {
//         name: "delegate-registry",
//         version: "1.0",
//         chainId: data.tokenChainId,
//         verifyingContract: this.contractAddress,
//       },
//       primaryType: "RegisterDelegate",
//       types,
//     });
//     const { r, s, v } = this.getRSV(signature);
//     const { data: payload } =
//       await this.contract.populateTransaction.registerDelegateBySig(
//         address,
//         data.tokenAddress,
//         BigInt(data.tokenChainId),
//         metadata,
//         nonce,
//         expiry,
//         v,
//         r,
//         s
//       );
//     // eslint-disable-next-line no-console
//     console.log({ payload, signature, r, s, v });
//     if (!payload) throw new Error("Payload is undefined");
//     return [
//       {
//         data: payload,
//         chainId: 10,
//         target: this.contractAddress,
//       },
//       "{apiKey}", // filled in the api
//       {
//         retries: 3,
//       },
//     ];
//   }
//   /**
//    * Sends a sponsored call to the DelegateRegistry contract using GelatoRelay
//    * @param payload
//    * @returns
//    */
//   static async sendGelato(...params: Parameters<GelatoRelay["sponsoredCall"]>) {
//     const client = new this(params[0].target as Hex);
//     const relayResponse = await client.sponsoredCall(...params);
//     return {
//       taskId: relayResponse.taskId,
//       wait: () => client.wait(relayResponse.taskId),
//     };
//   }
//   /**
//    * Deregisters a delegate on the DelegateRegistry contract
//    * @param tokenAddress
//    * @param tokenChainId
//    * @returns
//    */
//   public deregisterDelegate(tokenAddress: string, tokenChainId: number) {
//     return this.transaction("deregisterDelegate", [tokenAddress, tokenChainId]);
//   }
//   /**
//    * Returns a delegate from the DelegateRegistry contract
//    * @param delegateAddress
//    * @param tokenAddress
//    * @param tokenChainId
//    * @returns
//    */
//   static async getDelegate(
//     addresses: string[],
//     tokenAddress: string,
//     tokenChainId: number
//   ): Promise<DelegateRegistryWithInterests[]> {
//     const query = `
//       {
//         delegates(where: { delegateAddress_in: ["${addresses.join(
//           '","'
//         )}"], tokenAddress: "${tokenAddress}", tokenChainId: ${tokenChainId} }) {
//           id
//           delegateAddress
//           tokenAddress
//           tokenChainId
//           statement
//           status
//           blockTimestamp
//           name
//           ipfsMetadata
//           acceptedCoC
//           interests
//         }
//       }`;
//     const {
//       data: {
//         data: { delegates },
//       },
//     } = await axios.post<{ data: DelegateStatementRes }>(this.subgraphUrl, {
//       query,
//     });
//     return delegates.map((item) => {
//       if (Array.isArray(item?.interests))
//         return item as DelegateRegistryWithInterests;
//       return <DelegateRegistryWithInterests>{
//         ...item,
//         interests: item.interests?.split(",") || [],
//       };
//     });
//   }
// }
