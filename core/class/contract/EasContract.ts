import { Hex, SignerOrProvider } from 'core/types';
import { Gelato, sendGelatoTxn, toUnix } from '../../utils';
import { ethers } from 'ethers';
import { GAP } from '../GAP';
import { getSignerAddress } from '../../utils/get-signer-address';
import {
  DelegatedRevocationRequest,
  RevocationRequest,
} from '@ethereum-attestation-service/eas-sdk';
import { AttestationError } from '../SchemaError';
import { getSigRSV } from '../../utils/get-sig-rsv';

const AttestationDataTypes = {
  Revoke: [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint64' },
  ],
};

export class EasContract {
  static async signAttestation(
    signer: SignerOrProvider,
    payload: RevocationRequest,
    expiry: number
  ) {
    const eas = GAP.getEAS(signer);

    // const [{ nonce }, { chainId }, version, name] = await Promise.all([
    //     await this.getNonce(signer, eas),
    //     await signer.provider.getNetwork(),
    //     await eas.functions.VERSION(),
    //     await eas.functions.getName(),
    //   ]);

    const expirationTime = toUnix(expiry);
    const { nonce, address } = await this.getNonce(signer, eas);
    const { chainId } = await signer.provider.getNetwork();
    const version = '1.0.0';
    const name = 'EAS';

    const domain = {
      chainId,
      name,
      version,
      verifyingContract: eas.address,
    };

    const data = {
      schema: payload.schema,
      uid: payload.data.uid,
      value: payload.data.value,
      nonce: BigInt(nonce),
      deadline: BigInt(expirationTime),
    };

    const signature = await (signer as any)._signTypedData(
      domain,
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

  static async revokeBySig(
    signer: SignerOrProvider,
    payload: RevocationRequest
  ) {
    // if (!GAP.gelatoOpts?.useGasless)
    //   throw new AttestationError(
    //     'REVOKE_ERROR',
    //     'Delegated revocation not enabled.'
    //   );

    const contract = GAP.getEAS(signer);
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
    const { r, s, v, chainId, address } = await this.signAttestation(
      signer,
      payload,
      expiry
    );

    const args: DelegatedRevocationRequest = {
      schema: payload.schema,
      data: payload.data,
      signature: { v, r, s },
      revoker: address,
    };

    // const { data: populatedTxn } =
    //   await contract.populateTransaction.revokeByDelegation(args);

    // if (!populatedTxn) throw new Error('Transaction data is empty');

    const tx = await contract.functions.revokeByDelegation(args, {
      gasLimit: 1000000,
    });
    const result = await tx.wait?.();
    console.log(result);
    return;

    // await sendGelatoTxn(
    //   ...Gelato.buildArgs(populatedTxn, chainId, contract.address as Hex)
    // );
  }
}
