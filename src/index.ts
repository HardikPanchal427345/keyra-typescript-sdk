import { KeyraServerClient, type KeyraServerClientConfig } from "./client.js";
import { AuthApi } from "./auth.js";
import { VerificationApi } from "./verification.js";

export { generatePkce } from "./oauth.js";
export type { PkcePair } from "./oauth.js";
export type {
  VerificationStatus,
  CreateVerificationInput,
  CreateVerificationResponse,
  ExchangeAuthorizationCodeInput,
  TokenExchangeResponse,
  ValidateVerificationInput,
  ValidateVerificationResponse,
} from "./types.js";
export { KeyraServerError } from "./errors.js";

/** Server-side KEYRA client for authorize/verify flow. */
export function createKeyraServer(config: KeyraServerClientConfig) {
  const client = new KeyraServerClient(config);
  const verification = new VerificationApi(client);
  const auth = new AuthApi(client);
  return {
    createVerification: verification.createVerification.bind(verification),
    exchangeAuthorizationCode: auth.exchangeAuthorizationCode.bind(auth),
    getOAuthUserInfo: auth.getOAuthUserInfo.bind(auth),
    validateVerification: verification.validateVerification.bind(verification),
  };
}
