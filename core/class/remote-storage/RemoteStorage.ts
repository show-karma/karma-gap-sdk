import axios from 'axios';
import { STORAGE_TYPE, TRemoteStorageOutput, TSchemaName } from 'core/types';

interface SponsoredRemote {
  url: string;
  responseParser: (response: any) => string;
}

export abstract class RemoteStorage<C = unknown> {
  protected client: C;
  readonly storageType: number;

  readonly sponsor?: SponsoredRemote;

  constructor(
    storageType: STORAGE_TYPE,
    /**
     * If set, will try to POST request to another server instead of
     * using the local instance.
     *
     * > If a response parser is not set, it will try to get { cid: string }.
     */
    sponsor: SponsoredRemote
  ) {
    this.storageType = storageType;
    this.sponsor = sponsor;
    this.interceptRemoteStorage();
  }

  /**
   * Try to save data to remote storage and return the CID.
   * IF sponsorUrl is set, this method will be automatically
   * intercepted and will send a POST request to the sponsorUrl
   * with the contents: `{ data: T, type: "<AttestationType>" }`
   */
  abstract save<T = unknown>(data: T, schemaName: string): Promise<string>;

  /**
   * Encodes the data according to the remote storage type parameters
   * OR returns the data as is if no encoding is required
   */
  abstract encode(data: unknown): TRemoteStorageOutput;

  /**
   * Get data from Remote Storage
   */
  abstract get<T = unknown>(args: unknown): Promise<T>;

  /**
   * If sponsorUrl is set, intercept the save method and send a POST request
   * to the sponsorUrl instead of using the local instance.
   * @returns
   */
  private interceptRemoteStorage() {
    if (!this.sponsor?.url) return;
    this.save = async (data: unknown, schemaName: TSchemaName) => {
      const { data: response } = await axios.post(this.sponsor.url, {
        data: data,
        type: schemaName,
      });

      return this.sponsor.responseParser?.(response) || response.cid;
    };
  }
}
