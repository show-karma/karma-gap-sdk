
import { NFTStorage, Blob } from "nft.storage";
import { AttestationError } from '../SchemaError';

export abstract class IPFS {
  protected client: NFTStorage;

  constructor(ipfsKey: string) {
    
    this.client = new NFTStorage({ token: ipfsKey })
  }

  /**
  * Insert the data in the IPFS and return the cid.
  */
   async save<T = unknown> (data: T): Promise<string> {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const cid = await this.client.storeBlob(blob);
      return cid; 
    } catch (error) {
      throw new AttestationError('IPFS_UPLOAD', `Error adding data to IPFS`);
    }
  }

  /**
  * Encode Attestation data using IPFS cid
  */
  protected abstract encode (data: string, storageType: number);
}
