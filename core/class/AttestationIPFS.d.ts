import { IPFS } from './IPFS/IPFS';
export declare class AttestationIPFS extends IPFS {
    /**
    * retrieve Attestation Details from IPFS by hash (CID)
    */
    getData<T>(ipfsHash: string): Promise<T>;
    encode(data: string, storageType: number): {
        ipfsHash: string;
        type: number;
    };
}
