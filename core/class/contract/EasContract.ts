import { Hex, SignerOrProvider } from 'core/types';
import { Gelato, sendGelatoTxn, toUnix } from '../../utils';
import { ethers } from 'ethers';
import { GAP } from '../GAP';
import { getSignerAddress } from '../../utils/get-signer-address';
import {
  AttestationRequest,
  DelegatedAttestationRequest,
  DelegatedRevocationRequest,
  RevocationRequest,
} from '@ethereum-attestation-service/eas-sdk';
import { getSigRSV } from '../../utils/get-sig-rsv';
import { nullRef } from '../../consts';
import { AttestationError } from '../SchemaError';

// Optimism impl != eas-contract repo impl
// keccak256("Revoke(bytes32 schema,bytes32 uid,uint256 nonce)").
// bytes32 private constant REVOKE_TYPEHASH = 0xa98d02348410c9c76735e0d0bb1396f4015ac2bb9615f9c2611d19d7a8a99650;
const RevocationDataTypes = {
  Revoke: [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
  ],
};
interface RevocationSignature {
  schema: string;
  uid: string;
  nonce: bigint;
}

// keccak256("Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)").
const AttestationDataTypes = {
  Attest: [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
  ],
};
interface AttestationSignature {
  schema: string;
  recipient: string;
  expirationTime: bigint;
  revocable: boolean;
  refUID: string;
  data: string;
  nonce: bigint;
}

export class EasContract {
  static readonly version = '1.0.0';
  static readonly contractName = 'EAS';

  static domain(chainId: bigint, verifyingContract: Hex) {
    return {
      chainId,
      name: this.contractName,
      version: this.version,
      verifyingContract,
    };
  }

  private static async prepareSignature(signer: SignerOrProvider) {
    const eas = GAP.getEAS(signer);

    const [{ nonce, address }, { chainId }] = await Promise.all([
      this.getNonce(signer, eas),
      signer.provider.getNetwork(),
    ]);

    return {
      nonce,
      address,
      chainId,
      eas,
    };
  }

  static async signRevocation(
    signer: SignerOrProvider,
    payload: RevocationRequest
  ) {
    const { nonce, address, chainId, eas } = await this.prepareSignature(
      signer
    );

    const data: RevocationSignature = {
      schema: payload.schema,
      uid: payload.data.uid,
      nonce: BigInt(nonce),
    };

    const signature = await (signer as any)._signTypedData(
      this.domain(chainId, eas.address as Hex),
      RevocationDataTypes,
      data
    );

    const { r, s, v } = getSigRSV(signature);

    return { r, s, v: Number(v), nonce, chainId, address };
  }

  static async signAttestation(
    signer: SignerOrProvider,
    payload: AttestationRequest,
    expirationTime: bigint
  ) {
    const { nonce, address, chainId, eas } = await this.prepareSignature(
      signer
    );

    const data: AttestationSignature = {
      schema: payload.schema,
      recipient: payload.data.recipient,
      expirationTime,
      revocable: payload.data.revocable || true,
      refUID: payload.data.refUID || nullRef,
      data: payload.data.data,
      nonce: BigInt(nonce),
    };

    const signature = await (signer as any)._signTypedData(
      this.domain(chainId, eas.address as Hex),
      AttestationDataTypes,
      data
    );

    const { r, s, v } = getSigRSV(signature);

    return { r, s, v: Number(v), nonce, chainId, address };
  }

  /**
   * Get nonce for the transaction
   * @param address
   * @returns
   */
  private static async getNonce(
    signer: SignerOrProvider,
    contract: ethers.Contract
  ) {
    const address = await getSignerAddress(signer);

    const nonce = <bigint>await contract.functions.getNonce(address);
    return {
      nonce: Number(nonce),
      next: Number(nonce + 1n),
      address,
    };
  }

  static async attestBySig(
    signer: SignerOrProvider,
    payload: AttestationRequest
  ) {
    if (!GAP.gelatoOpts?.useGasless)
      throw new AttestationError(
        'REVOKE_ERROR',
        'Delegated revocation not enabled.'
      );

    const contract = GAP.getEAS(signer);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
    const { r, s, v, chainId, address } = await this.signAttestation(
      signer,
      payload,
      expiry
    );

    const args: DelegatedAttestationRequest = {
      ...payload,
      signature: { v, r, s },
      attester: address,
    };

    // const { data: populatedTxn } =
    //   await contract.populateTransaction.revokeByDelegation(args);

    // if (!populatedTxn) throw new Error('Transaction data is empty');

    const tx = await contract.functions.attestByDelegation(args, {
      // gasLimit: 1000000,
    });
    const result = await tx.wait?.();
    console.log(result);
    return;

    // await sendGelatoTxn(
    //   ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    // );
  }

  static async revokeBySig(
    signer: SignerOrProvider,
    payload: RevocationRequest
  ) {
    if (!GAP.gelatoOpts?.useGasless)
      throw new AttestationError(
        'REVOKE_ERROR',
        'Delegated revocation not enabled.'
      );

    const contract = GAP.getEAS(signer);
    const { r, s, v, chainId, address } = await this.signRevocation(
      signer,
      payload
    );

    const args: DelegatedRevocationRequest = {
      schema: payload.schema,
      data: payload.data,
      signature: { v, r, s },
      revoker: address,
    };

    const { data: populatedTxn } =
      await contract.populateTransaction.revokeByDelegation(args);

    if (!populatedTxn) throw new Error('Transaction data is empty');

    // const tx = await contract.functions.revokeByDelegation(args, {
    //   // gasLimit: 1000000,
    // });
    // const result = await tx.wait?.();
    // console.log(result);
    // return;

    await sendGelatoTxn(
      ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    );
  }
}
