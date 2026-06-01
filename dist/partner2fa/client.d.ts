import { type KeyraServerClientConfig } from "../client.js";
export type KeyraPartnerClientConfig = KeyraServerClientConfig & {
    projectId: string;
    clientId: string;
    clientSecret: string;
};
export declare class KeyraPartnerClient {
    readonly projectId: string;
    readonly clientId: string;
    readonly clientSecret: string;
    private readonly http;
    constructor(config: KeyraPartnerClientConfig);
    private authHeaders;
    request<T>(path: string, init?: RequestInit): Promise<T>;
}
