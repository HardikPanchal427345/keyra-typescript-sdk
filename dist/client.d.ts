export type KeyraServerClientConfig = {
    baseUrl: string;
    timeoutMs?: number;
};
export declare class KeyraServerClient {
    readonly baseUrl: string;
    readonly timeoutMs: number;
    constructor(config: KeyraServerClientConfig);
    request<T>(path: string, init?: RequestInit): Promise<T>;
}
