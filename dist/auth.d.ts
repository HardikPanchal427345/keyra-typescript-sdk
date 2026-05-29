import { KeyraServerClient } from "./client.js";
import type { ExchangeAuthorizationCodeInput, TokenExchangeResponse } from "./types.js";
export declare class AuthApi {
    private readonly client;
    constructor(client: KeyraServerClient);
    exchangeAuthorizationCode(input: ExchangeAuthorizationCodeInput): Promise<TokenExchangeResponse>;
    getOAuthUserInfo(accessToken: string): Promise<Record<string, unknown>>;
}
