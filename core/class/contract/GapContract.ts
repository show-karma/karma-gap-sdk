import {
  MultiRevocationRequest,
  getUIDsFromAttestReceipt,
} from "@ethereum-attestation-service/eas-sdk";
import {
  CallbackStatus,
  Hex,
  RawAttestationPayload,
  RawMultiAttestPayload,
  SignerOrProvider,
} from "core/types";
import { Transaction, createTransaction } from "../../utils/unified-types";
import { Gelato, sendGelatoTxn } from "../../utils/gelato/send-gelato-txn";
import { serializeWithBigint } from "../../utils/serialize-bigint";
import {
  isWalletClient,
  isKernelClient,
  supportsPaymaster,
  getPublicClient,
} from "../../utils";
import { GAP } from "../GAP";
import { AttestationWithTx } from "../types/attestations";
import type {
  PublicClient,
  WalletClient,
  Transport,
  Chain,
  Account,
} from "viem";
import { KernelAccountClient } from "@zerodev/sdk";
import { kernelToEthersSigner } from "../../../utils/kernel";

// Zero bytes32 constant for properly formatted empty UIDs
const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;

type TSignature = {
  r: string;
  s: string;
  v: string;
  nonce: number;
  chainId: bigint;
};

const AttestationDataTypes = {
  Attest: [
    { name: "payloadHash", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
};

export class GapContract {
  static nonces: { [key: string]: number } = {};
  /**
   * Signs a message for the delegated attestation.
   * @param signer
   * @param payload
   * @returns r,s,v signature
   */
  private static async signAttestation(
    signer: SignerOrProvider,
    payload: string,
    expiry: bigint
  ): Promise<TSignature> {
    let { nonce } = await this.getNonce(signer);
    const contract = await GAP.getMulticall(signer);
    const contractAddress =
      (contract as any).address || (contract as any).contractAddress;

    // Get chain ID based on signer type
    let chainId: bigint;
    if (isWalletClient(signer)) {
      chainId = BigInt(
        (signer as WalletClient<Transport, Chain, Account>).chain?.id || 1
      );
    } else {
      // Fallback for providers
      const { chainId: id } = await (signer as any).provider.getNetwork();
      chainId = BigInt(id);
    }

    const domain = {
      chainId,
      name: "gap-attestation",
      version: "1",
      verifyingContract: contractAddress,
    };

    const data = { payloadHash: payload, nonce, expiry };

    console.log({ domain, AttestationDataTypes, data });

    let signature: string;
    if (isWalletClient(signer)) {
      const walletClient = signer as WalletClient<Transport, Chain, Account>;
      signature = await walletClient.signTypedData({
        account: walletClient.account!,
        domain: domain as any,
        types: AttestationDataTypes,
        primaryType: "Attest",
        message: data as any,
      });
    } else {
      throw new Error("Unsupported signer type for signing");
    }

    const { r, s, v } = this.getRSV(signature);
    return { r, s, v, nonce, chainId };
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

  public static async getSignerAddress(signer: SignerOrProvider): Promise<Hex> {
    if (isWalletClient(signer)) {
      const walletClient = signer as WalletClient<Transport, Chain, Account>;
      return walletClient.account?.address as Hex;
    } else {
      throw new Error("Unsupported signer type");
    }
  }

  /**
   * Get nonce for the transaction
   * @param address
   * @returns
   */
  private static async getNonce(signer: SignerOrProvider) {
    const contract = await GAP.getMulticall(signer);
    const address = await this.getSignerAddress(signer);

    console.log({ address });

    let nonce: bigint;
    // UniversalContract
    nonce = (await contract.read("nonces", [address])) as bigint;

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
  static async attest(
    signer: SignerOrProvider,
    payload: RawAttestationPayload,
    callback?: ((status: CallbackStatus) => void) & ((status: string) => void)
  ): Promise<AttestationWithTx> {
    const contract = await GAP.getMulticall(signer);

    // Check if we should use ZeroDev paymaster instead of Gelato
    if (
      GAP.zeroDevOpts?.enabled &&
      isKernelClient(signer) &&
      supportsPaymaster(signer)
    ) {
      return this.attestWithPaymaster(
        signer as unknown as KernelAccountClient,
        payload,
        callback
      );
    }

    if (GAP.gelatoOpts?.useGasless) {
      return this.attestBySig(signer, payload);
    }
    callback?.("preparing");

    let tx: any;
    let result: any;

    const txHash = await (contract as any).write("attest", [
      {
        schema: payload.schema,
        data: payload.data.payload,
      },
    ]);
    callback?.("pending");

    const walletClient = signer as PublicClient<Transport, Chain>;
    const { createPublicClient, http } = await import("viem");
    const publicClient = createPublicClient({
      chain: walletClient.chain,
      transport: http(
        walletClient.transport.url ||
          walletClient.transport.url_ ||
          walletClient.transport._url
      ),
    });
    result = await publicClient.waitForTransactionReceipt({ hash: txHash });

    callback?.("confirmed");

    const attestations = getUIDsFromAttestReceipt(result)[0];

    return {
      tx: [createTransaction(txHash as string)],
      uids: [attestations as Hex],
    };
  }

  /**
   * Send a single attestation using ZeroDev paymaster
   * @param signer
   * @param payload
   * @returns
   */
  private static async attestWithPaymaster(
    signer: KernelAccountClient,
    payload: RawAttestationPayload,
    callback?: ((status: CallbackStatus) => void) & ((status: string) => void)
  ): Promise<AttestationWithTx> {
    callback?.("preparing");

    const contract = await GAP.getMulticall(signer);
    const kernelClient = signer as any; // KernelClient extends WalletClient

    try {
      const attestationData = {
        ...payload.data.payload,
        refUID: payload.data.payload.refUID || ZERO_BYTES32,
      };

      const txHash = await kernelClient.writeContract({
        account: kernelClient.account,
        chain: kernelClient.chain,
        address: contract.address,
        abi: contract.abi,
        functionName: "attest",
        args: [
          {
            schema: payload.schema,
            data: attestationData,
          },
        ],
      });

      callback?.("pending");

      const provider = (await kernelToEthersSigner(kernelClient)).provider;
      const result = await provider.waitForTransaction(txHash);

      callback?.("confirmed");

      const attestations = getUIDsFromAttestReceipt(result as any)[0];

      return {
        tx: [createTransaction(txHash as string)],
        uids: [attestations as Hex],
      };
    } catch (error) {
      console.error("ZeroDev paymaster transaction failed:", error);
      throw error;
    }
  }

  static async attestBySig(
    signer: SignerOrProvider,
    payload: RawAttestationPayload
  ) {
    const contract = await GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const address = await this.getSignerAddress(signer);
    const payloadHash = serializeWithBigint({
      schema: payload.schema,
      data: payload.data.raw,
    });

    const { r, s, v, nonce, chainId } = await this.signAttestation(
      signer,
      payloadHash,
      expiry
    );

    let populatedTxn: any;
    let contractAddress: string;

    if ((contract as any).encodeFunctionData) {
      // UniversalContract
      populatedTxn = (contract as any).encodeFunctionData("attestBySig", [
        {
          data: payload.data.payload,
          schema: payload.schema,
        },
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s,
      ]);
      contractAddress = (contract as any).contractAddress;
    } else {
      // ethers Contract
      const tx = await (contract as any).attestBySig.populateTransaction(
        {
          data: payload.data.payload,
          schema: payload.schema,
        },
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s
      );
      populatedTxn = tx.data;
      contractAddress = await (contract as any).getAddress();
    }

    if (!populatedTxn) throw new Error("Transaction data is empty");

    const txn = await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contractAddress as Hex)
    );

    const attestations = await this.getTransactionLogs(signer, txn);
    return {
      tx: [createTransaction(txn as string)],
      uids: attestations,
    };
  }

  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiAttest(
    signer: SignerOrProvider,
    payload: RawMultiAttestPayload[],
    callback?: Function
  ): Promise<AttestationWithTx> {
    const contract = await GAP.getMulticall(signer);

    // Check if we should use ZeroDev paymaster instead of Gelato
    if (
      GAP.zeroDevOpts?.enabled &&
      isKernelClient(signer) &&
      supportsPaymaster(signer)
    ) {
      return this.multiAttestWithPaymaster(
        signer as unknown as KernelAccountClient,
        payload,
        callback
      );
    }

    if (GAP.gelatoOpts?.useGasless) {
      return this.multiAttestBySig(signer, payload);
    }
    if (callback) callback("preparing");

    let result: any;

    const mappedPayload = payload.map((p) => ({
      uid: p.payload.uid,
      refIdx: Number(p.payload.refIdx),
      multiRequest: p.payload.multiRequest,
    }));

    const txHash = await (contract as any).write("multiSequentialAttest", [
      mappedPayload,
    ]);
    if (callback) callback("pending");

    const walletClient = signer as any;
    try {
      const { createPublicClient, http } = await import("viem");
      const publicClient = createPublicClient({
        chain: walletClient.chain,
        transport: http(
          walletClient.transport.url ||
            walletClient.transport.url_ ||
            walletClient.transport._url
        ),
      });
      result = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
    } catch (error) {
      console.warn(
        "Public client approach failed, using basic wait:",
        error.message
      );
      // Simple wait and poll approach
      await new Promise((resolve) => setTimeout(resolve, 3000));
      result = await walletClient.getTransactionReceipt({ hash: txHash });
    }

    if (callback) callback("confirmed");

    const attestations = getUIDsFromAttestReceipt(result);

    return {
      tx: [createTransaction(txHash as string)],
      uids: attestations as Hex[],
    };
  }

  /**
   * Performs a referenced multi attestation using ZeroDev paymaster.
   * Uses smart account capabilities for gasless transactions.
   *
   * @returns an array with the attestation UIDs.
   */
  private static async multiAttestWithPaymaster(
    signer: KernelAccountClient,
    payload: RawMultiAttestPayload[],
    callback?: Function
  ): Promise<AttestationWithTx> {
    if (callback) callback("preparing");

    const contract = await GAP.getMulticall(signer);
    const kernelClient = signer; // KernelClient extends WalletClient

    // Ensure extremely clean payload formatting for ZeroDev/viem compatibility
    const mappedPayload = payload.map((p) => {
      // Extract and validate each field explicitly
      const uid =
        p.payload.uid && p.payload.uid !== "0x" ? p.payload.uid : ZERO_BYTES32;

      const refIdx =
        typeof p.payload.refIdx === "number" ? p.payload.refIdx : 0;

      const schema = p.payload.multiRequest.schema;

      // Process data array with extreme care for type conversion
      const data = p.payload.multiRequest.data.map((item) => {
        // Extract each field explicitly to avoid any object reference issues
        const recipient = String(item.recipient);
        const expirationTime =
          typeof item.expirationTime === "bigint"
            ? item.expirationTime
            : BigInt(item.expirationTime || 0);
        const revocable = Boolean(item.revocable);
        const refUID =
          item.refUID && item.refUID !== "0x"
            ? String(item.refUID)
            : ZERO_BYTES32;
        const dataField = String(item.data);
        const value =
          typeof item.value === "bigint" ? item.value : BigInt(item.value || 0);

        // Return a completely clean object
        return {
          recipient: recipient as Hex,
          expirationTime: expirationTime,
          revocable: revocable,
          refUID: refUID as Hex,
          data: dataField as Hex,
          value: value,
        };
      });

      // Return a completely clean payload object
      return {
        uid: uid as Hex,
        refIdx: refIdx,
        multiRequest: {
          schema: schema as Hex,
          data: data,
        },
      };
    });

    try {
      // Use ZeroDev's writeContract with paymaster for gasless transactions
      const txHash = await kernelClient.writeContract({
        account: kernelClient.account,
        chain: kernelClient.chain,
        address: contract.address,
        abi: contract.abi,
        functionName: "multiSequentialAttest",
        args: [mappedPayload],
        // ZeroDev paymaster will automatically sponsor gas if configured
      });

      if (callback) callback("pending");

      // Wait for transaction receipt using KernelClient's built-in method

      const provider = (await kernelToEthersSigner(kernelClient)).provider;
      const result = await provider.waitForTransaction(txHash);

      if (callback) callback("confirmed");

      const attestations = getUIDsFromAttestReceipt(result as any);

      return {
        tx: [createTransaction(txHash as string)],
        uids: attestations as Hex[],
      };
    } catch (error) {
      console.error("ZeroDev paymaster transaction failed:", error);
      console.error(
        "Payload that caused the error:",
        JSON.stringify(
          mappedPayload,
          (key, value) =>
            typeof value === "bigint" ? value.toString() + "n" : value,
          2
        )
      );
      throw error;
    }
  }

  /**
   * Performs a referenced multi attestation by signature.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiAttestBySig(
    signer: SignerOrProvider,
    payload: RawMultiAttestPayload[]
  ): Promise<AttestationWithTx> {
    const contract = await GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const address = await this.getSignerAddress(signer);

    const payloadHash = serializeWithBigint(payload.map((p) => p.raw));

    const { r, s, v, nonce, chainId } = await this.signAttestation(
      signer,
      payloadHash,
      expiry
    );

    console.info({ r, s, v, nonce, chainId, payloadHash, address });

    let populatedTxn: any;
    let contractAddress: string;

    if ((contract as any).encodeFunctionData) {
      // UniversalContract
      const mappedPayload = payload.map((p) => ({
        uid: p.payload.uid,
        refIdx: Number(p.payload.refIdx), // Ensure refIdx is a number, not BigInt
        multiRequest: p.payload.multiRequest,
      }));

      populatedTxn = (contract as any).encodeFunctionData(
        "multiSequentialAttestBySig",
        [[mappedPayload], payloadHash, address, nonce, expiry, v, r, s]
      );
      contractAddress = (contract as any).contractAddress;
    } else {
      // ethers Contract
      const tx = await (
        contract as any
      ).multiSequentialAttestBySig.populateTransaction(
        [payload.map((p) => p.payload)],
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s
      );
      populatedTxn = tx.data;
      contractAddress = await (contract as any).getAddress();
    }

    if (!populatedTxn) throw new Error("Transaction data is empty");

    const txn = await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contractAddress as Hex)
    );

    const attestations = await this.getTransactionLogs(signer, txn);
    return {
      tx: [createTransaction(txn as string)],
      uids: attestations as Hex[],
    };
  }

  static async multiRevoke(
    signer: SignerOrProvider,
    payload: MultiRevocationRequest[]
  ): Promise<AttestationWithTx> {
    const contract = await GAP.getMulticall(signer);

    if (GAP.gelatoOpts?.useGasless) {
      return this.multiRevokeBySig(signer, payload);
    }

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("multiRevoke", [payload]);
      return {
        tx: [createTransaction(txHash as string)],
        uids: [],
      };
    } else {
      // ethers Contract
      const tx = await (contract as any).multiRevoke(payload);
      return {
        tx: [tx],
        uids: [],
      };
    }
  }

  /**
   * Performs a multi revocation by signature.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiRevokeBySig(
    signer: SignerOrProvider,
    payload: MultiRevocationRequest[]
  ): Promise<AttestationWithTx> {
    const contract = await GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const address = await this.getSignerAddress(signer);

    const payloadHash = serializeWithBigint(payload);

    const { r, s, v, nonce, chainId } = await this.signAttestation(
      signer,
      payloadHash,
      expiry
    );

    console.info({ r, s, v, nonce, chainId, payloadHash, address });

    let populatedTxn: any;
    let contractAddress: string;

    if ((contract as any).encodeFunctionData) {
      // UniversalContract
      populatedTxn = (contract as any).encodeFunctionData("multiRevokeBySig", [
        payload,
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s,
      ]);
      contractAddress = (contract as any).contractAddress;
    } else {
      // ethers Contract
      const tx = await (contract as any).multiRevokeBySig.populateTransaction(
        payload,
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s
      );
      populatedTxn = tx.data;
      contractAddress = await (contract as any).getAddress();
    }

    if (!populatedTxn) throw new Error("Transaction data is empty");

    const txn = await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contractAddress as Hex)
    );

    return {
      tx: [createTransaction(txn as string)],
      uids: [],
    };
  }

  /**
   * Transfer the ownership of an attestation
   * @param signer
   * @param projectUID
   * @param newOwner
   * @returns
   */
  static async transferProjectOwnership(
    signer: SignerOrProvider,
    projectUID: Hex,
    newOwner: Hex
  ) {
    const contract = await GAP.getProjectResolver(signer);

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("transferProjectOwnership", [
        projectUID,
        newOwner,
      ]);
      // Wait for transaction
      if (isWalletClient(signer)) {
        const walletClient = signer as WalletClient<Transport, Chain, Account>;
        const publicClient = walletClient as any;
        return publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        const provider = (signer as any).provider || signer;
        return provider.waitForTransaction(txHash);
      }
    } else {
      // ethers Contract
      const tx = await (contract as any).transferProjectOwnership(
        projectUID,
        newOwner
      );
      return tx.wait?.();
    }
  }

  /**
   * Check if the signer is the owner of the project
   * @param signer
   * @param projectUID
   * @param projectChainId
   * @param publicAddress
   * @returns
   */
  static async isProjectOwner(
    signer: SignerOrProvider,
    projectUID: Hex,
    projectChainId: number,
    publicAddress?: string
  ): Promise<boolean> {
    const contract = await GAP.getProjectResolver(signer, projectChainId);
    const address = publicAddress || (await this.getSignerAddress(signer));

    const isOwner = await contract.read("isOwner", [projectUID, address]);
    return isOwner as boolean;
  }

  /**
   * Check if the signer is admin of the project
   * @param signer
   * @param projectUID
   * @param projectChainId
   * @param publicAddress
   * @returns
   */
  static async isProjectAdmin(
    signer: SignerOrProvider,
    projectUID: Hex,
    projectChainId: number,
    publicAddress?: string
  ): Promise<boolean> {
    const contract = await GAP.getProjectResolver(signer, projectChainId);
    const address = publicAddress || (await this.getSignerAddress(signer));

    // UniversalContract
    const isAdmin = await (contract as any).read("isAdmin", [
      projectUID,
      address,
    ]);
    return isAdmin as boolean;
  }

  private static async getTransactionLogs(
    signer: SignerOrProvider,
    txnHash: string
  ) {
    let receipt: any;
    // Wait for transaction
    if (isWalletClient(signer)) {
      const walletClient = signer as WalletClient<Transport, Chain, Account>;
      const publicClient = walletClient as any;
      receipt = await publicClient.waitForTransactionReceipt({
        hash: txnHash as Hex,
      });
    } else {
      const provider = (signer as any).provider || signer;
      receipt = await provider.waitForTransaction(txnHash as Hex);
    }

    if (!receipt || !receipt.logs?.length)
      throw new Error("Transaction not found");

    // Returns the txn logs with the attestation results
    return getUIDsFromAttestReceipt(receipt as any) as Hex[];
  }

  /**
   * Add Project Admin
   * @param signer
   * @param projectUID
   * @param newAdmin
   * @returns
   */
  static async addProjectAdmin(
    signer: SignerOrProvider,
    projectUID: Hex,
    newAdmin: Hex
  ) {
    const contract = await GAP.getProjectResolver(signer);

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("addAdmin", [
        projectUID,
        newAdmin,
      ]);
      // Wait for transaction
      if (isWalletClient(signer)) {
        const walletClient = signer as WalletClient<Transport, Chain, Account>;
        const publicClient = walletClient as any;
        return publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        const provider = (signer as any).provider || signer;
        return provider.waitForTransaction(txHash);
      }
    } else {
      // ethers Contract
      const tx = await (contract as any).addAdmin(projectUID, newAdmin);
      return tx.wait?.();
    }
  }

  /**
   * Remove Project Admin
   * @param signer
   * @param projectUID
   * @param oldAdmin
   * @returns
   */
  static async removeProjectAdmin(
    signer: SignerOrProvider,
    projectUID: Hex,
    oldAdmin: Hex
  ) {
    const contract = await GAP.getProjectResolver(signer);

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("removeAdmin", [
        projectUID,
        oldAdmin,
      ]);
      // Wait for transaction
      if (isWalletClient(signer)) {
        const walletClient = signer as WalletClient<Transport, Chain, Account>;
        const publicClient = walletClient as any;
        return publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        const provider = (signer as any).provider || signer;
        return provider.waitForTransaction(txHash);
      }
    } else {
      // ethers Contract
      const tx = await (contract as any).removeAdmin(projectUID, oldAdmin);
      return tx.wait?.();
    }
  }
}
