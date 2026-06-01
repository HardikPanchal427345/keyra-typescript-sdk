import { KeyraServerError } from "./errors.js";
import { KeyraNetworkError } from "./partner2fa/errors.js";

export type KeyraServerClientConfig = {
  baseUrl: string;
  timeoutMs?: number;
};

export class KeyraServerClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;

  constructor(config: KeyraServerClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? 15000;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new KeyraServerError(`Keyra request failed: ${res.status}`, res.status, body);
      return body as T;
    } catch (err) {
      // Normalize network/abort failures into a stable SDK error.
      if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
        throw new KeyraNetworkError("Keyra request timed out", err);
      }
      if (err instanceof TypeError) {
        throw new KeyraNetworkError("Keyra network error", err);
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }
}
