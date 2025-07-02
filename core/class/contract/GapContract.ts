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
import { isEthersSigner, isWalletClient } from "../../utils";
import { GAP } from "../GAP";
import { AttestationWithTx } from "../types/attestations";
import type {
  PublicClient,
  WalletClient,
  Transport,
  Chain,
  Account,
} from "viem";

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
   * Supports both ethers and viem signers.
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
    if (isEthersSigner(signer)) {
      const network = await (signer as any).provider.getNetwork();
      chainId = BigInt(network.chainId);
    } else if (isWalletClient(signer)) {
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
    if (isEthersSigner(signer)) {
      signature = await (signer as any)._signTypedData(
        domain,
        AttestationDataTypes,
        data
      );
    } else if (isWalletClient(signer)) {
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
    if (isEthersSigner(signer)) {
      return (await (signer as any).getAddress()) as Hex;
    } else if (isWalletClient(signer)) {
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
    if ((contract as any).read) {
      // UniversalContract
      nonce = (await (contract as any).read("nonces", [address])) as bigint;
    } else {
      // ethers Contract
      nonce = <bigint>await (contract as any).nonces(address);
    }

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

    if (GAP.gelatoOpts?.useGasless) {
      return this.attestBySig(signer, payload);
    }
    callback?.("preparing");

    let tx: any;
    let result: any;

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("attest", [
        {
          schema: payload.schema,
          data: payload.data.payload,
        },
      ]);
      callback?.("pending");

      // Wait for transaction using viem
      if (isWalletClient(signer)) {
        const walletClient = signer as WalletClient<Transport, Chain, Account>;
        const publicClient = walletClient as any; // Wallet clients can read too
        result = await publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        // For ethers, use the provider's wait method
        const provider = (signer as any).provider || signer;
        result = await provider.waitForTransaction(txHash);
      }
      callback?.("confirmed");

      const attestations = getUIDsFromAttestReceipt(result)[0];

      return {
        tx: [createTransaction(txHash as string)],
        uids: [attestations as Hex],
      };
    } else {
      // ethers Contract
      tx = await (contract as any)
        .attest({
          schema: payload.schema,
          data: payload.data.payload,
        })
        .then((res: any) => {
          callback?.("pending");
          return res;
        });
      result = await tx.wait?.();
      callback?.("confirmed");
      const attestations = getUIDsFromAttestReceipt(result)[0];
      const resultArray = [result].flat();

      return {
        tx: resultArray,
        uids: [attestations as Hex],
      };
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

    if (GAP.gelatoOpts?.useGasless) {
      return this.multiAttestBySig(signer, payload);
    }
    if (callback) callback("preparing");

    let tx: any;
    let result: any;

    if ((contract as any).write) {
      // UniversalContract
      const txHash = await (contract as any).write("multiSequentialAttest", [
        payload.map((p) => p.payload),
      ]);
      if (callback) callback("pending");

      // Wait for transaction using viem
      if (isWalletClient(signer)) {
        const walletClient = signer as WalletClient<Transport, Chain, Account>;
        const publicClient = walletClient as any; // Wallet clients can read too
        result = await publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        // For ethers, use the provider's wait method
        const provider = (signer as any).provider || signer;
        result = await provider.waitForTransaction(txHash);
      }
      if (callback) callback("confirmed");

      const attestations = getUIDsFromAttestReceipt(result);

      return {
        tx: [createTransaction(txHash as string)],
        uids: attestations as Hex[],
      };
    } else {
      // ethers Contract
      tx = await (contract as any).multiSequentialAttest(
        payload.map((p) => p.payload)
      );

      if (callback) callback("pending");
      result = await tx.wait?.();
      if (callback) callback("confirmed");
      const attestations = getUIDsFromAttestReceipt(result);

      const resultArray = [result].flat();

      return {
        tx: resultArray,
        uids: attestations as Hex[],
      };
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
      populatedTxn = (contract as any).encodeFunctionData(
        "multiSequentialAttestBySig",
        [
          payload.map((p) => p.payload),
          payloadHash,
          address,
          nonce,
          expiry,
          v,
          r,
          s,
        ]
      );
      contractAddress = (contract as any).contractAddress;
    } else {
      // ethers Contract
      const tx = await (
        contract as any
      ).multiSequentialAttestBySig.populateTransaction(
        payload.map((p) => p.payload),
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

    if ((contract as any).read) {
      // UniversalContract
      const isOwner = await (contract as any).read("isOwner", [
        projectUID,
        address,
      ]);
      return isOwner as boolean;
    } else {
      // ethers Contract
      const isOwner = await (contract as any).isOwner(projectUID, address);
      return isOwner;
    }
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

    if ((contract as any).read) {
      // UniversalContract
      const isAdmin = await (contract as any).read("isAdmin", [
        projectUID,
        address,
      ]);
      return isAdmin as boolean;
    } else {
      // ethers Contract
      const isAdmin = await (contract as any).isAdmin(projectUID, address);
      return isAdmin;
    }
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
