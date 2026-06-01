import type {
  ChallengePollResult,
  ChallengeSession,
  ConsumeChallengeResult,
  EnrollmentPollResult,
  EnrollmentSession,
  IdentityStatus,
  KeyraPartnerConfig,
  RecoveryCodesResult,
  RecoverySession,
} from "./types.js";
import { KeyraPartnerClient } from "./client.js";
import {
  enrichChallengeSession,
  enrichConsumeChallengeResult,
  enrichEnrollmentPollResult,
  enrichEnrollmentSession,
  enrichIdentityStatus,
} from "./normalize.js";
import {
  KeyraChallengeDeniedError,
  KeyraChallengeExpiredError,
  KeyraEnrollmentCancelledError,
  KeyraEnrollmentExpiredError,
  KeyraEnrollmentFailedError,
  KeyraTimeoutError,
} from "./errors.js";

export type Enable2FAOptions = { returnUrl?: string };
export type StartAuthOptions = { nonce?: string; returnUrl?: string };
export type Disable2FAOptions = { reason?: string };
export type WaitChallengeOptions = { timeoutMs?: number; intervalMs?: number };
export type WaitEnrollmentOptions = { timeoutMs?: number; intervalMs?: number };

export class KeyraPartner2FA {
  private readonly client: KeyraPartnerClient;

  constructor(config: KeyraPartnerConfig) {
    this.client = new KeyraPartnerClient(config);
  }

  get2FAStatus(externalUserId: string): Promise<IdentityStatus> {
    return this.client.request<Omit<IdentityStatus, "enabled">>("/v1/identities/status", {
      method: "POST",
      body: JSON.stringify({
        projectId: this.client.projectId,
        externalUserId,
      }),
    }).then(enrichIdentityStatus);
  }

  enable2FA(externalUserId: string, opts: Enable2FAOptions = {}): Promise<EnrollmentSession> {
    return this.client.request<Omit<EnrollmentSession, "qrCode">>("/v1/identities/enroll", {
      method: "POST",
      body: JSON.stringify({
        projectId: this.client.projectId,
        externalUserId,
        returnUrl: opts.returnUrl,
      }),
    }).then(enrichEnrollmentSession);
  }

  startAuthentication(externalUserId: string, opts: StartAuthOptions = {}): Promise<ChallengeSession> {
    return this.client.request<Omit<ChallengeSession, "qrCode">>("/v1/auth/challenge", {
      method: "POST",
      body: JSON.stringify({
        projectId: this.client.projectId,
        externalUserId,
        nonce: opts.nonce,
        returnUrl: opts.returnUrl,
      }),
    }).then(enrichChallengeSession);
  }

  pollChallenge(challengeId: string): Promise<ChallengePollResult> {
    return this.client.request<ChallengePollResult>(`/v1/auth/challenge/${encodeURIComponent(challengeId)}`);
  }

  pollEnrollment(enrollmentId: string): Promise<EnrollmentPollResult> {
    return this.client
      .request<EnrollmentPollResult>(`/v1/identities/enroll/${encodeURIComponent(enrollmentId)}/status`)
      .then((r) => enrichEnrollmentPollResult({ ...r, enrollmentId }));
  }

  async waitForEnrollment(enrollmentId: string, opts: WaitEnrollmentOptions = {}): Promise<EnrollmentPollResult> {
    const timeoutMs = opts.timeoutMs ?? 600_000;
    const intervalMs = opts.intervalMs ?? 1500;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.pollEnrollment(enrollmentId);
      if (result.terminal === "COMPLETED") return result;
      if (result.terminal === "EXPIRED") throw new KeyraEnrollmentExpiredError();
      if (result.terminal === "CANCELLED") throw new KeyraEnrollmentCancelledError();
      if (result.terminal === "FAILED") throw new KeyraEnrollmentFailedError();
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new KeyraTimeoutError("Enrollment timed out");
  }

  async waitForChallengeApproval(
    challengeId: string,
    opts: WaitChallengeOptions = {},
  ): Promise<ChallengePollResult> {
    const timeoutMs = opts.timeoutMs ?? 120_000;
    const intervalMs = opts.intervalMs ?? 1500;
    const deadline = Date.now() + timeoutMs;
    let pollAfterMs = intervalMs;

    while (Date.now() < deadline) {
      const result = await this.pollChallenge(challengeId);
      pollAfterMs = result.pollAfterMs ?? intervalMs;
      if (result.status === "approved" && result.verificationToken) {
        return result;
      }
      if (result.status === "denied") throw new KeyraChallengeDeniedError();
      if (result.status === "expired") throw new KeyraChallengeExpiredError();
      await new Promise((r) => setTimeout(r, pollAfterMs));
    }
    throw new KeyraTimeoutError("Challenge approval timed out");
  }

  consumeChallenge(challengeId: string, verificationToken: string): Promise<ConsumeChallengeResult> {
    return this.client
      .request<ConsumeChallengeResult>(
      `/v1/auth/challenge/${encodeURIComponent(challengeId)}/consume`,
      {
        method: "POST",
        body: JSON.stringify({ verificationToken }),
      },
      )
      .then(enrichConsumeChallengeResult);
  }

  disable2FA(externalUserId: string, _opts: Disable2FAOptions = {}): Promise<void> {
    return this.get2FAStatus(externalUserId).then(async (status) => {
      if (!status.identityId) throw new Error("No identity to disable");
      await this.client.request(`/v1/identities/${encodeURIComponent(status.identityId)}/disable`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  }

  recoverIdentity(externalUserId: string): Promise<RecoverySession> {
    return this.get2FAStatus(externalUserId).then(async (status) => {
      if (!status.identityId) throw new Error("No active identity");
      return this.client.request<RecoverySession>(
        `/v1/identities/${encodeURIComponent(status.identityId)}/recovery/initiate`,
        { method: "POST", body: JSON.stringify({}) },
      );
    });
  }

  generateRecoveryCodes(externalUserId: string): Promise<RecoveryCodesResult> {
    return this.get2FAStatus(externalUserId).then(async (status) => {
      if (!status.identityId) throw new Error("No active identity");
      return this.client.request<RecoveryCodesResult>(
        `/v1/identities/${encodeURIComponent(status.identityId)}/recovery/codes`,
        { method: "POST", body: JSON.stringify({}) },
      );
    });
  }
}

export function createKeyraPartner2FA(config: KeyraPartnerConfig): KeyraPartner2FA {
  return new KeyraPartner2FA(config);
}
