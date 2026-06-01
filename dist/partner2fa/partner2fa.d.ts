import type { ChallengePollResult, ChallengeSession, ConsumeChallengeResult, EnrollmentPollResult, EnrollmentSession, IdentityStatus, KeyraPartnerConfig, RecoveryCodesResult, RecoverySession } from "./types.js";
export type Enable2FAOptions = {
    returnUrl?: string;
};
export type StartAuthOptions = {
    nonce?: string;
};
export type Disable2FAOptions = {
    reason?: string;
};
export type WaitChallengeOptions = {
    timeoutMs?: number;
    intervalMs?: number;
};
export type WaitEnrollmentOptions = {
    timeoutMs?: number;
    intervalMs?: number;
};
export declare class KeyraPartner2FA {
    private readonly client;
    constructor(config: KeyraPartnerConfig);
    get2FAStatus(externalUserId: string): Promise<IdentityStatus>;
    enable2FA(externalUserId: string, opts?: Enable2FAOptions): Promise<EnrollmentSession>;
    startAuthentication(externalUserId: string, opts?: StartAuthOptions): Promise<ChallengeSession>;
    pollChallenge(challengeId: string): Promise<ChallengePollResult>;
    pollEnrollment(enrollmentId: string): Promise<EnrollmentPollResult>;
    waitForEnrollment(enrollmentId: string, opts?: WaitEnrollmentOptions): Promise<EnrollmentPollResult>;
    waitForChallengeApproval(challengeId: string, opts?: WaitChallengeOptions): Promise<ChallengePollResult>;
    consumeChallenge(challengeId: string, verificationToken: string): Promise<ConsumeChallengeResult>;
    disable2FA(externalUserId: string, _opts?: Disable2FAOptions): Promise<void>;
    recoverIdentity(externalUserId: string): Promise<RecoverySession>;
    generateRecoveryCodes(externalUserId: string): Promise<RecoveryCodesResult>;
}
export declare function createKeyraPartner2FA(config: KeyraPartnerConfig): KeyraPartner2FA;
