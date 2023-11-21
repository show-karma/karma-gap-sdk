import { IPFS } from './IPFS/IPFS';

export class AttestationIPFS extends IPFS {
  /**
  * retrieve Attestation Details from IPFS by hash (CID)
  */
  async getData<T> (ipfsHash: string): Promise<T> {
    // implement using Axios
    return new Promise(() => { });
  }

  encode (data: string, storageType: number) {
    return { ipfsHash: data, type: storageType };
  }
}

