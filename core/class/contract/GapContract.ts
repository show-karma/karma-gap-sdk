import { Hex, MultiAttestData, SignerOrProvider } from "core/types";
import { GAP } from "../GAP";
import { AttestationRequest } from "@ethereum-attestation-service/eas-sdk";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { ethers } from "ethers";

enum TaskState {
  CheckPending = "CheckPending",
  ExecPending = "ExecPending",
  ExecSuccess = "ExecSuccess",
  ExecReverted = "ExecReverted",
  WaitingForConfirmation = "WaitingForConfirmation",
  Blacklisted = "Blacklisted",
  Cancelled = "Cancelled",
  NotFound = "NotFound",
}

type TSignature = {
  r: string;
  s: string;
  v: string;
  nonce: number;
};

const AttestationDataTypes = {
  Attest: [
    { name: "request", type: "AttestationRequest" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
  AttestationRequest: [
    { name: "schema", type: "bytes32" },
    { name: "data", type: "AttestationRequestData" },
  ],
  AttestationRequestData: [
    { name: "recipient", type: "address" },
    { name: "expirationTime", type: "uint64" },
    { name: "revocable", type: "bool" },
    { name: "refUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "value", type: "uint256" },
  ],
};

export class GapContract extends GelatoRelay {
  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiAttest(
    signer: SignerOrProvider,
    payload: MultiAttestData[]
  ): Promise<Hex[]> {
    const contract = GAP.getMulticall(signer);

    const tx = await contract.functions.multiSequentialAttest(payload);
    const result = await tx.wait?.();
    const attestations = result.logs?.map((m) => m.data);

    return attestations as Hex[];
  }

  /**
   * Signs a message for the delegated attestation.
   * @param signer
   * @param payload
   * @returns r,s,v signature
   */
  private static async signAttestation(
    signer: SignerOrProvider & { address: Hex },
    payload: AttestationRequest,
    expiry: bigint
  ): Promise<TSignature> {
    const { nonce } = await this.getNonce(signer);
    const { chainId } = await signer.provider.getNetwork();
    const signature = await (signer as any)._signTypedData(
      {
        chainId,
        name: "gap-attestation",
        version: "1.0",
        verifyingContract: GAP.getMulticall(null).address,
      },
      AttestationDataTypes,
      { request: payload, nonce, expiry }
    );

    const { r, s, v } = this.getRSV(signature);
    return { r, s, v, nonce };
  }

  /**
   * Returns the r, s, v values of a signature
   * @param signature
   * @returns
   */
  private static getRSV(signature: string) {
    const r = signature.slice(0, 66);
    const s = `0x${signature.slice(66, 130)}`;
    const v = `0x${signature.slice(130, 132)}`;
    return { r, s, v };
  }

  /**
   * Get nonce for the transaction
   * @param address
   * @returns
   */
  private static async getNonce(signer: SignerOrProvider) {
    const contract = GAP.getMulticall(signer);
    const nonce = <bigint>await contract.functions.nonces(signer.address);
    console.log("here", nonce);
    return {
      nonce: Number(nonce),
      next: Number(nonce + 1n),
    };
  }

  /**
   * Send a single attestation
   * @param signer
   * @param payload
   * @returns
   */
  static async attest(signer: SignerOrProvider, payload: AttestationRequest) {
    const contract = GAP.getMulticall(signer);

    const tx = await contract.functions.attest(payload);
    const result = await tx.wait?.();
    const attestations = result.logs?.map((m) => m.data);

    return attestations[0] as Hex;
  }

  static async attestBySig(
    signer: SignerOrProvider,
    payload: AttestationRequest
  ) {
    const contract = GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

    const { r, s, v, nonce } = await this.signAttestation(
      signer,
      payload,
      expiry
    );

    const tx = await contract.functions.attestBySig(
      payload,
      signer.address,
      nonce,
      expiry,
      v,
      r,
      s
    );

    const result = await tx.wait?.();
    const attestations = result.logs?.map((m) => m.data);

    return attestations[0] as Hex;
    // if (!tx.data) throw new Error("Transaction data is empty");

    // return [
    //   {
    //     data: payload,
    //     chainId,
    //     target: contract.address,
    //   },
    //   "{apiKey}", // filled in the api
    //   {
    //     retries: 3,
    //   },
    // ];
  }

  /**
   * Sends a sponsored call to the DelegateRegistry contract using GelatoRelay
   * @param payload
   * @returns
   */
  static async sendGelato(...params: Parameters<GelatoRelay["sponsoredCall"]>) {
    const client = new this();
    const relayResponse = await client.sponsoredCall(...params);

    return {
      taskId: relayResponse.taskId,
      wait: () => client.wait(relayResponse.taskId),
    };
  }

  /**
   * Waits for a transaction to be mined at Gelato Network
   * @param taskId
   * @returns
   */
  private wait(taskId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const loop = async () => {
        const oneSecond = 1;
        while (oneSecond) {
          const status = await this.getTaskStatus(taskId);
          // print status :D so we can debug this for now
          // eslint-disable-next-line no-console
          console.log(status);
          if (!status) {
            reject(new Error("Transaction goes wrong."));
            break;
          }
          if (status && status.taskState === TaskState.ExecSuccess) {
            resolve(status.transactionHash || "");
            break;
          } else if (
            [
              TaskState.Cancelled,
              TaskState.ExecReverted,
              TaskState.Blacklisted,
            ].includes(status?.taskState)
          ) {
            reject(
              new Error(
                status.lastCheckMessage
                  ?.split(/(RegisterDelegate)|(Execution error): /)
                  .at(-1) || ""
              )
            );
            break;
          }

          await new Promise((r) => setTimeout(r, 500));
        }
      };
      loop();
    });
  }
}
