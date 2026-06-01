import { KeyraServerClient } from "../client.js";
import { KeyraServerError } from "../errors.js";
import { KeyraAuthenticationError } from "./errors.js";
export class KeyraPartnerClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.http = new KeyraServerClient({ baseUrl: config.baseUrl, timeoutMs: config.timeoutMs });
    }
    authHeaders() {
        return {
            Authorization: `Bearer ${this.clientId}:${this.clientSecret}`,
            "Content-Type": "application/json",
        };
    }
    request(path, init = {}) {
        return this.http
            .request(path, {
            ...init,
            headers: {
                ...this.authHeaders(),
                ...init.headers,
            },
        })
            .catch((err) => {
            if (err instanceof KeyraServerError && err.status === 401) {
                const body = err.body;
                if (body?.error === "invalid_client") {
                    throw new KeyraAuthenticationError(body?.message ?? "Invalid API credentials");
                }
            }
            throw err;
        });
    }
}
