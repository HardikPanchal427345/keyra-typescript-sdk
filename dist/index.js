import { KeyraServerClient } from "./client.js";
import { AuthApi } from "./auth.js";
import { VerificationApi } from "./verification.js";
export { generatePkce } from "./oauth.js";
export { KeyraServerError } from "./errors.js";
export { KeyraError, KeyraNetworkError, KeyraAuthenticationError, KeyraTimeoutError, KeyraChallengeExpiredError, KeyraChallengeDeniedError, KeyraEnrollmentExpiredError, KeyraEnrollmentCancelledError, KeyraEnrollmentFailedError, } from "./partner2fa/errors.js";
/** Server-side KEYRA client for authorize/verify flow. */
export { createKeyraPartner2FA, KeyraPartner2FA } from "./partner2fa/partner2fa.js";
export function createKeyraServer(config) {
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
