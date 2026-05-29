export class VerificationApi {
    constructor(client) {
        this.client = client;
    }
    createVerification(input) {
        return this.client.request("/verify/start", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    validateVerification(input) {
        return this.client.request("/verify/validate", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
}
