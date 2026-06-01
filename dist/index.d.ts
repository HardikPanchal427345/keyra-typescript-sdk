import { type KeyraServerClientConfig } from "./client.js";
export { generatePkce } from "./oauth.js";
export type { PkcePair } from "./oauth.js";
export type { VerificationStatus, CreateVerificationInput, CreateVerificationResponse, ExchangeAuthorizationCodeInput, TokenExchangeResponse, ValidateVerificationInput, ValidateVerificationResponse, } from "./types.js";
export { KeyraServerError } from "./errors.js";
export { KeyraError, KeyraNetworkError, KeyraAuthenticationError, KeyraTimeoutError, KeyraChallengeExpiredError, KeyraChallengeDeniedError, KeyraEnrollmentExpiredError, KeyraEnrollmentCancelledError, KeyraEnrollmentFailedError, } from "./partner2fa/errors.js";
/** Server-side KEYRA client for authorize/verify flow. */
export { createKeyraPartner2FA, KeyraPartner2FA } from "./partner2fa/partner2fa.js";
export type { KeyraPartnerConfig, IdentityStatus, EnrollmentSession, EnrollmentPollResult, EnrollmentTerminalStatus, ChallengeSession, ChallengePollResult, ConsumeChallengeResult, RecoverySession, RecoveryCodesResult, } from "./partner2fa/types.js";
export declare function createKeyraServer(config: KeyraServerClientConfig): {
    createVerification: (input: import("./types.js").CreateVerificationInput) => Promise<import("./types.js").CreateVerificationResponse>;
    exchangeAuthorizationCode: (input: import("./types.js").ExchangeAuthorizationCodeInput) => Promise<import("./types.js").TokenExchangeResponse>;
    getOAuthUserInfo: (accessToken: string) => Promise<Record<string, unknown>>;
    validateVerification: (input: import("./types.js").ValidateVerificationInput) => Promise<import("./types.js").ValidateVerificationResponse>;
};
