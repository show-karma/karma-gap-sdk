import pinataSDK from "@pinata/sdk";
import { RemoteStorage } from "./RemoteStorage";
import { TRemoteStorageOutput } from "core/types";
export interface IpfsStorageOptions {
    token: string;
}
export declare class IpfsStorage extends RemoteStorage<pinataSDK> {
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
}
