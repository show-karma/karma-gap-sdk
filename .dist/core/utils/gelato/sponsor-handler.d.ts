export interface ApiRequest {
    method: string;
    body: unknown;
}
export interface ApiResponse {
    statusCode: number;
    send: (body: unknown) => void;
}
export declare function handler(req: ApiRequest, res: ApiResponse, env_gelatoApiKey: string): Promise<void>;
