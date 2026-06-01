import type { ChallengeSession, ConsumeChallengeResult, EnrollmentPollResult, EnrollmentSession, EnrollmentTerminalStatus, IdentityStatus } from "./types.js";
export declare function enrichIdentityStatus(status: Omit<IdentityStatus, "enabled">): IdentityStatus;
export declare function enrichEnrollmentSession(session: Omit<EnrollmentSession, "qrCode">): EnrollmentSession;
export declare function enrichChallengeSession(session: Omit<ChallengeSession, "qrCode">): ChallengeSession;
export declare function normalizeEnrollmentTerminal(raw: Pick<EnrollmentPollResult, "status" | "identityStatus">): EnrollmentTerminalStatus | null;
export declare function enrichEnrollmentPollResult(result: EnrollmentPollResult): EnrollmentPollResult;
export declare function enrichConsumeChallengeResult(result: ConsumeChallengeResult): ConsumeChallengeResult;
