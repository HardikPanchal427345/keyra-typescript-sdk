export type KeyraPartnerConfig = {
  baseUrl: string;
  projectId: string;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
};

export type IdentityStatus = {
  enrolled: boolean;
  /** Alias for `enrolled` (DX). */
  enabled: boolean;
  identityId: string | null;
  status: "none" | "pending" | "active" | "suspended" | "revoked";
  factors: Array<{ type: string; verifiedAt?: string }>;
  enrolledAt?: string | null;
};

export type EnrollmentSession = {
  identityId: string;
  enrollmentId: string;
  status: string;
  expiresIn: number;
  enrollmentUrl: string;
  /** String to encode as a QR code (alias of `enrollmentUrl`). */
  qrCode: string;
  pollUrl: string;
};

export type EnrollmentPollResult = {
  enrollmentId: string;
  status: string;
  identityId: string;
  identityStatus: string;
  completedAt?: string | null;
  terminal?: EnrollmentTerminalStatus;
};

export type EnrollmentTerminalStatus = "COMPLETED" | "EXPIRED" | "FAILED" | "CANCELLED";

export type ChallengeSession = {
  challengeId: string;
  status: string;
  expiresIn: number;
  challengeUrl: string;
  /** String to encode as a QR code (alias of `challengeUrl`). */
  qrCode: string;
  pollAfterMs: number;
};

export type ChallengePollResult = {
  challengeId: string;
  status: string;
  identityId?: string;
  approvedAt?: string;
  expiresAt?: string;
  verificationToken?: string;
  pollAfterMs?: number;
};

export type RecoverySession = {
  recoverySessionId: string;
  recoveryUrl: string;
  expiresIn: number;
};

export type RecoveryCodesResult = {
  identityId: string;
  codes: string[];
};

export type ConsumeChallengeResult = {
  consumed: boolean;
  challengeId: string;
  identityId: string | null;
};
