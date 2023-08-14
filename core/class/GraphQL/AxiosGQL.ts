import type { AxiosInstance } from "axios";
import axios from "axios";

export abstract class AxiosGQL {
  client: AxiosInstance;

  constructor(url: string) {
    this.client = axios.create({
      baseURL: url,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  protected async query<R = unknown, T = unknown>(
    query: string,
    variables?: T
  ): Promise<R> {
    const {
      data: { data },
    } = await this.client.post<{ data: R }>("", {
      query,
      variables,
    });

    return data;
  }
}
