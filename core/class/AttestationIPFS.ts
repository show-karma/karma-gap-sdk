import { IPFS } from './IPFS/IPFS';

export class AttestationIPFS extends IPFS {
  encode (data: string, storageType: number) {
    return { ipfsHash: data, type: storageType };
  }
}

