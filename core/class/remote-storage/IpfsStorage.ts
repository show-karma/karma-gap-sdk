import { NFTStorage } from 'nft.storage';
import { RemoteStorage } from './RemoteStorage';
import { RemoteStorageError } from '../SchemaError';
import { getIPFSData } from '../../utils';
import { STORAGE_TYPE, TRemoteStorageOutput } from 'core/types';

export interface IpfsStorageOptions {
  token: string;
  endpoint?: URL;
}

export class IpfsStorage extends RemoteStorage<NFTStorage> {
  constructor(
    opts: IpfsStorageOptions,
    /**
     * If set, will send request to another server instead of
     * using the local instance
     */
    sponsor?: RemoteStorage['sponsor']
  ) {
    super(STORAGE_TYPE.IPFS, sponsor);

    this.assert(opts);
    this.client = new NFTStorage({ ...opts });
  }

  private assert(opts: IpfsStorageOptions) {}

  async save<T = unknown>(data: T): Promise<string> {
    try {
      const blob = new Blob([JSON.stringify(data)], {
        type: 'application/json',
      });
      const cid = await this.client.storeBlob(blob);
      return cid;
    } catch (error) {
      throw new RemoteStorageError(
        'REMOTE_STORAGE_UPLOAD',
        `Error adding data to IPFS`
      );
    }
  }

  encode(data: string): TRemoteStorageOutput<string> {
    return { hash: data, storageType: this.storageType };
  }

  async get<T = unknown>(args: { cid: string }): Promise<T> {
    return getIPFSData<T>(args.cid);
  }
}
