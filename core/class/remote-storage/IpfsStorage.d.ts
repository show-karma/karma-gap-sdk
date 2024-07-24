import { RemoteStorage } from "./RemoteStorage";
import { TRemoteStorageOutput } from "core/types";
export interface IpfsStorageOptions {
    token: string;
}
export declare class IpfsStorage extends RemoteStorage {
    private pinataJWTToken;
    constructor(opts: IpfsStorageOptions, 
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor?: RemoteStorage["sponsor"]);
    private assert;
    save<T = unknown>(data: T, schemaName: string): Promise<string>;
    encode(data: string): TRemoteStorageOutput<string>;
    get<T = unknown>(args: {
        cid: string;
    }): Promise<T>;
    saveAndGetCID(data: any, schemaName: string, pinataMetadata?: {
        name: string;
    }): Promise<any>;
}
