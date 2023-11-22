import { NFTStorage } from "nft.storage";
export declare abstract class IPFS {
    protected client: NFTStorage;
    constructor(ipfsKey: string);
    /**
    * Insert the data in the IPFS and return the cid.
    */
    save<T = unknown>(data: T): Promise<string>;
    /**
    * Encode Attestation data using IPFS cid
    */
    protected abstract encode(data: string, storageType: number): any;
}
