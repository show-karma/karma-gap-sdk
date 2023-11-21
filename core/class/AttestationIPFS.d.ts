import { IPFS } from './IPFS/IPFS';
export declare class AttestationIPFS extends IPFS {
    /**
    * retrieve Attestation Details from IPFS by hash (CID)
    */
    getData<T>(ipfsHash: string): Promise<T>;
    encode<T>(data: T, storageType: number): T;
}
