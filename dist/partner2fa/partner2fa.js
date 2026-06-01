import { KeyraPartnerClient } from "./client.js";
import { enrichChallengeSession, enrichConsumeChallengeResult, enrichEnrollmentPollResult, enrichEnrollmentSession, enrichIdentityStatus, } from "./normalize.js";
import { KeyraChallengeDeniedError, KeyraChallengeExpiredError, KeyraEnrollmentCancelledError, KeyraEnrollmentExpiredError, KeyraEnrollmentFailedError, KeyraTimeoutError, } from "./errors.js";
export class KeyraPartner2FA {
    constructor(config) {
        this.client = new KeyraPartnerClient(config);
    }
    get2FAStatus(externalUserId) {
        return this.client.request("/v1/identities/status", {
            method: "POST",
            body: JSON.stringify({
                projectId: this.client.projectId,
                externalUserId,
            }),
        }).then(enrichIdentityStatus);
    }
    enable2FA(externalUserId, opts = {}) {
        return this.client.request("/v1/identities/enroll", {
            method: "POST",
            body: JSON.stringify({
                projectId: this.client.projectId,
                externalUserId,
                returnUrl: opts.returnUrl,
            }),
        }).then(enrichEnrollmentSession);
    }
    startAuthentication(externalUserId, opts = {}) {
        return this.client.request("/v1/auth/challenge", {
            method: "POST",
            body: JSON.stringify({
                projectId: this.client.projectId,
                externalUserId,
                nonce: opts.nonce,
            }),
        }).then(enrichChallengeSession);
    }
    pollChallenge(challengeId) {
        return this.client.request(`/v1/auth/challenge/${encodeURIComponent(challengeId)}`);
    }
    pollEnrollment(enrollmentId) {
        return this.client
            .request(`/v1/identities/enroll/${encodeURIComponent(enrollmentId)}/status`)
            .then((r) => enrichEnrollmentPollResult({ ...r, enrollmentId }));
    }
    async waitForEnrollment(enrollmentId, opts = {}) {
        const timeoutMs = opts.timeoutMs ?? 600000;
        const intervalMs = opts.intervalMs ?? 1500;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const result = await this.pollEnrollment(enrollmentId);
            if (result.terminal === "COMPLETED")
                return result;
            if (result.terminal === "EXPIRED")
                throw new KeyraEnrollmentExpiredError();
            if (result.terminal === "CANCELLED")
                throw new KeyraEnrollmentCancelledError();
            if (result.terminal === "FAILED")
                throw new KeyraEnrollmentFailedError();
            await new Promise((r) => setTimeout(r, intervalMs));
        }
        throw new KeyraTimeoutError("Enrollment timed out");
    }
    async waitForChallengeApproval(challengeId, opts = {}) {
        const timeoutMs = opts.timeoutMs ?? 120000;
        const intervalMs = opts.intervalMs ?? 1500;
        const deadline = Date.now() + timeoutMs;
        let pollAfterMs = intervalMs;
        while (Date.now() < deadline) {
            const result = await this.pollChallenge(challengeId);
            pollAfterMs = result.pollAfterMs ?? intervalMs;
            if (result.status === "approved" && result.verificationToken) {
                return result;
            }
            if (result.status === "denied")
                throw new KeyraChallengeDeniedError();
            if (result.status === "expired")
                throw new KeyraChallengeExpiredError();
            await new Promise((r) => setTimeout(r, pollAfterMs));
        }
        throw new KeyraTimeoutError("Challenge approval timed out");
    }
    consumeChallenge(challengeId, verificationToken) {
        return this.client
            .request(`/v1/auth/challenge/${encodeURIComponent(challengeId)}/consume`, {
            method: "POST",
            body: JSON.stringify({ verificationToken }),
        })
            .then(enrichConsumeChallengeResult);
    }
    disable2FA(externalUserId, _opts = {}) {
        return this.get2FAStatus(externalUserId).then(async (status) => {
            if (!status.identityId)
                throw new Error("No identity to disable");
            await this.client.request(`/v1/identities/${encodeURIComponent(status.identityId)}/disable`, {
                method: "POST",
                body: JSON.stringify({}),
            });
        });
    }
    recoverIdentity(externalUserId) {
        return this.get2FAStatus(externalUserId).then(async (status) => {
            if (!status.identityId)
                throw new Error("No active identity");
            return this.client.request(`/v1/identities/${encodeURIComponent(status.identityId)}/recovery/initiate`, { method: "POST", body: JSON.stringify({}) });
        });
    }
    generateRecoveryCodes(externalUserId) {
        return this.get2FAStatus(externalUserId).then(async (status) => {
            if (!status.identityId)
                throw new Error("No active identity");
            return this.client.request(`/v1/identities/${encodeURIComponent(status.identityId)}/recovery/codes`, { method: "POST", body: JSON.stringify({}) });
        });
    }
}
export function createKeyraPartner2FA(config) {
    return new KeyraPartner2FA(config);
}
