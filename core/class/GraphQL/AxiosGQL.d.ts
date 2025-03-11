import type { AxiosInstance } from "axios";
export declare abstract class AxiosGQL {
    protected client: AxiosInstance;
    constructor(url: string);
    protected query<R = unknown, T = unknown>(query: string, variables?: T): Promise<R>;
}
