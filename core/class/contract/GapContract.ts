import {
  Hex,
  RawAttestationPayload,
  RawMultiAttestPayload,
  SignerOrProvider,
} from "core/types";
import { GAP } from "../GAP";
import { serializeWithBigint } from "../../utils/serialize-bigint";
import { Gelato, sendGelatoTxn } from "../../utils/gelato/send-gelato-txn";
import { mapFilter } from "../../utils";
import {
  MultiRevocationRequest,
  getUIDFromAttestTx,
  getUIDsFromAttestReceipt,
} from "@ethereum-attestation-service/eas-sdk";

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
    const { chainId } = await signer.provider.getNetwork();
    const address = await this.getSignerAddress(signer);

    if (this.nonces[address] === nonce) {
      nonce++;
    }

    this.nonces[address] = nonce;

    const domain = {
      chainId,
      name: "gap-attestation",
      version: "1",
      verifyingContract: GAP.getMulticall(null).address,
    };

    const data = { payloadHash: payload, nonce, expiry };

    console.log({ domain, AttestationDataTypes, data });

    const signature = await (signer as any)._signTypedData(
      domain,
      AttestationDataTypes,
      data
    );

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

  private static async getSignerAddress(signer: SignerOrProvider) {
    const address =
      signer.address || signer._address || (await signer.getAddress());
    if (!address)
      throw new Error(
        "Signer does not provider either address or getAddress()."
      );
    return address;
  }

  /**
   * Get nonce for the transaction
   * @param address
   * @returns
   */
  private static async getNonce(signer: SignerOrProvider) {
    const contract = GAP.getMulticall(signer);
    const address = await this.getSignerAddress(signer);

    console.log({ address });

    const nonce = <bigint>await contract.functions.nonces(address);
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
    payload: RawAttestationPayload
  ) {
    const contract = GAP.getMulticall(signer);

    if (GAP.gelatoOpts?.useGasless) {
      return this.attestBySig(signer, payload);
    }

    const tx = await contract.functions.attest({
      schema: payload.schema,
      data: payload.data.payload,
    });

    const result = await tx.wait?.();
    const attestations = getUIDsFromAttestReceipt(result)[0];

    return attestations as Hex;
  }

  static async attestBySig(
    signer: SignerOrProvider,
    payload: RawAttestationPayload
  ) {
    const contract = GAP.getMulticall(signer);
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

    const { data: populatedTxn } =
      await contract.populateTransaction.attestBySig(
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

    if (!populatedTxn) throw new Error("Transaction data is empty");

    const txn = await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    );

    const attestations = await this.getTransactionLogs(signer, txn);
    return attestations[0];
  }

  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiAttest(
    signer: SignerOrProvider,
    payload: RawMultiAttestPayload[]
  ): Promise<Hex[]> {
    const contract = GAP.getMulticall(signer);

    if (GAP.gelatoOpts?.useGasless) {
      return this.multiAttestBySig(signer, payload);
    }

    const tx = await contract.functions.multiSequentialAttest(
      payload.map((p) => p.payload)
    );

    const result = await tx.wait?.();
    const attestations = getUIDsFromAttestReceipt(result);

    return attestations as Hex[];
  }

  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiAttestBySig(
    signer: SignerOrProvider,
    payload: RawMultiAttestPayload[]
  ): Promise<Hex[]> {
    const contract = GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const address = await this.getSignerAddress(signer);

    const payloadHash = serializeWithBigint(payload.map((p) => p.raw));

    const { r, s, v, nonce, chainId } = await this.signAttestation(
      signer,
      payloadHash,
      expiry
    );

    console.info({ r, s, v, nonce, chainId, payloadHash, address });

    const { data: populatedTxn } =
      await contract.populateTransaction.multiSequentialAttestBySig(
        payload.map((p) => p.payload),
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s
      );

    if (!populatedTxn) throw new Error("Transaction data is empty");

    const txn = await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    );

    const attestations = await this.getTransactionLogs(signer, txn);
    return attestations;
  }

  static async multiRevoke(
    signer: SignerOrProvider,
    payload: MultiRevocationRequest[]
  ) {
    const contract = GAP.getMulticall(signer);

    if (GAP.gelatoOpts?.useGasless) {
      return this.multiRevokeBySig(signer, payload);
    }

    const tx = await contract.functions.multiRevoke(payload);

    return tx.wait?.();
  }

  /**
   * Performs a referenced multi attestation.
   *
   * @returns an array with the attestation UIDs.
   */
  static async multiRevokeBySig(
    signer: SignerOrProvider,
    payload: MultiRevocationRequest[]
  ): Promise<void> {
    const contract = GAP.getMulticall(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const address = await this.getSignerAddress(signer);

    const payloadHash = serializeWithBigint(payload);

    const { r, s, v, nonce, chainId } = await this.signAttestation(
      signer,
      payloadHash,
      expiry
    );

    console.info({ r, s, v, nonce, chainId, payloadHash, address });

    const { data: populatedTxn } =
      await contract.populateTransaction.multiRevokeBySig(
        payload,
        payloadHash,
        address,
        nonce,
        expiry,
        v,
        r,
        s
      );

    if (!populatedTxn) throw new Error("Transaction data is empty");

    await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    );
  }

  private static async getTransactionLogs(
    signer: SignerOrProvider,
    txnHash: string
  ) {
    const txn = await signer.provider.getTransactionReceipt(txnHash);
    if (!txn || !txn.logs.length) throw new Error("Transaction not found");

    // Returns the txn logs with the attestation results. Tha last two logs are the
    // the ones from the GelatoRelay contract.
    return getUIDsFromAttestReceipt(txn) as Hex[];
  }
}