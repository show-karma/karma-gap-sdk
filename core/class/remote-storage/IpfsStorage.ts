import { RemoteStorage } from "./RemoteStorage";
import { RemoteStorageError } from "../SchemaError";
import { getIPFSData } from "../../utils";
import { STORAGE_TYPE, TRemoteStorageOutput } from "../../types";
import axios from "axios";

export interface IpfsStorageOptions {
  token: string;
}

/**
 * IPFS Storage implementation
 *
 * This class is provider-agnostic as it doesn't interact with the blockchain.
 * It only handles IPFS storage operations.
 */
export class IpfsStorage extends RemoteStorage {
  private pinataJWTToken: string;

  constructor(
    opts: IpfsStorageOptions,
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor?: RemoteStorage["sponsor"]
  ) {
    super(STORAGE_TYPE.IPFS, sponsor);

    this.assert(opts);
    this.pinataJWTToken = opts.token;
  }

  private assert(opts: IpfsStorageOptions) {
    if (!opts.token) {
      throw new RemoteStorageError(
        "MISSING_FIELD",
        "IPFS storage requires a Pinata JWT token"
      );
    }
  }

  async save<T = unknown>(data: T): Promise<string> {
    try {
      const cid = await this.saveAndGetCID(data);
      return cid;
    } catch (error) {
      throw new RemoteStorageError(
        "REMOTE_STORAGE_UPLOAD",
        `Error adding data to IPFS: ${error.message}`
      );
    }
  }

  encode(data: string): TRemoteStorageOutput<string> {
    return { hash: data, storageType: this.storageType };
  }

  async get<T = unknown>(args: { cid: string }): Promise<T> {
    return getIPFSData<T>(args.cid);
  }

  async saveAndGetCID(
    data: any,
    pinataMetadata = { name: "via karma-gap-sdk" }
  ) {
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: data,
          pinataMetadata: pinataMetadata,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.pinataJWTToken}`,
          },
        }
      );
      return res.data.IpfsHash;
    } catch (error) {
      throw new RemoteStorageError(
        "REMOTE_STORAGE_UPLOAD",
        `Error adding data to IPFS: ${error.message}`
      );
    }
  }
}
