import { KeyraServerClient } from "./client.js";
import type { ExchangeAuthorizationCodeInput, TokenExchangeResponse } from "./types.js";

export class AuthApi {
  constructor(private readonly client: KeyraServerClient) {}

  exchangeAuthorizationCode(input: ExchangeAuthorizationCodeInput) {
    return this.client.request<TokenExchangeResponse>("/oauth/token", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: input.code,
        code_verifier: input.code_verifier,
        redirect_uri: input.redirect_uri,
        client_id: input.client_id,
      }),
    });
  }

  getOAuthUserInfo(accessToken: string) {
    return this.client.request<Record<string, unknown>>("/oauth/userinfo", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
