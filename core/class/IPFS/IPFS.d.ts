import { NFTStorage } from "nft.storage";
export declare abstract class IPFS {
    protected client: NFTStorage;
    constructor(ipfsKey: string);
    /**
    * Insert the data in the IPFS and return the cid.
    */
    save<T = unknown>(data: T): Promise<string>;
    /**
    * retrieve data from IPFS by hash (CID)
    */
    protected abstract getData<T = unknown>(ipfsHash: string): Promise<T>;
    protected abstract encode(data: string, storageType: number): any;
}
