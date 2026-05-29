import { KeyraServerError } from "./errors.js";
export class KeyraServerClient {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.timeoutMs = config.timeoutMs ?? 15000;
    }
    async request(path, init) {
        const headers = new Headers(init?.headers ?? {});
        if (!headers.has("Content-Type"))
            headers.set("Content-Type", "application/json");
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                ...init,
                headers,
                signal: ctrl.signal,
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new KeyraServerError(`Keyra request failed: ${res.status}`, res.status, body);
            return body;
        }
        finally {
            clearTimeout(t);
        }
    }
}
