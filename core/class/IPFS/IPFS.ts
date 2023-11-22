
import { NFTStorage, Blob } from "nft.storage";

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
      console.log("Sending IPFS: ", data)
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const cid = await this.client.storeBlob(blob);
      console.log("Result ipfs: ", cid)
      return cid; 
    } catch (error) {
      console.error('Error adding data to IPFS:', error);
      throw error;
    }
  }

  /**
  * Encode data using IPFS (CID)
  */
  protected abstract encode (data: string, storageType: number);
}
