export class AuthApi {
    constructor(client) {
        this.client = client;
    }
    exchangeAuthorizationCode(input) {
        return this.client.request("/oauth/token", {
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
    getOAuthUserInfo(accessToken) {
        return this.client.request("/oauth/userinfo", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    }
}
