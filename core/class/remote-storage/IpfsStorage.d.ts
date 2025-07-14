import { RemoteStorage } from "./RemoteStorage";
import { TRemoteStorageOutput } from "../../types";
export interface IpfsStorageOptions {
    token: string;
}
/**
 * IPFS Storage implementation
 *
 * This class is provider-agnostic as it doesn't interact with the blockchain.
 * It only handles IPFS storage operations.
 */
export declare class IpfsStorage extends RemoteStorage {
    private pinataJWTToken;
    constructor(opts: IpfsStorageOptions, 
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor?: RemoteStorage["sponsor"]);
    private assert;
    save<T = unknown>(data: T): Promise<string>;
    encode(data: string): TRemoteStorageOutput<string>;
    get<T = unknown>(args: {
        cid: string;
    }): Promise<T>;
    saveAndGetCID(data: any, pinataMetadata?: {
        name: string;
    }): Promise<any>;
}
