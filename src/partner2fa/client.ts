import { KeyraServerClient, type KeyraServerClientConfig } from "../client.js";
import { KeyraServerError } from "../errors.js";
import { KeyraAuthenticationError } from "./errors.js";

export type KeyraPartnerClientConfig = KeyraServerClientConfig & {
  projectId: string;
  clientId: string;
  clientSecret: string;
};

export class KeyraPartnerClient {
  readonly projectId: string;
  readonly clientId: string;
  readonly clientSecret: string;
  private readonly http: KeyraServerClient;

  constructor(config: KeyraPartnerClientConfig) {
    this.projectId = config.projectId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.http = new KeyraServerClient({ baseUrl: config.baseUrl, timeoutMs: config.timeoutMs });
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.clientId}:${this.clientSecret}`,
      "Content-Type": "application/json",
    };
  }

  request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.http
      .request<T>(path, {
        ...init,
        headers: {
          ...this.authHeaders(),
          ...(init.headers as Record<string, string> | undefined),
        },
      })
      .catch((err) => {
        if (err instanceof KeyraServerError && err.status === 401) {
          const body = err.body as { error?: string; message?: string } | null;
          if (body?.error === "invalid_client") {
            throw new KeyraAuthenticationError(body?.message ?? "Invalid API credentials");
          }
        }
        throw err;
      });
  }
}
