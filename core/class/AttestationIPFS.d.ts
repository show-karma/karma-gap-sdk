import { IPFS } from './IPFS/IPFS';
export declare class AttestationIPFS extends IPFS {
    encode(data: string, storageType: number): {
        ipfsHash: string;
        type: number;
    };
}
