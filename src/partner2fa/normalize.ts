import type {
  ChallengeSession,
  ConsumeChallengeResult,
  EnrollmentPollResult,
  EnrollmentSession,
  EnrollmentTerminalStatus,
  IdentityStatus,
} from "./types.js";

export function enrichIdentityStatus(status: Omit<IdentityStatus, "enabled">): IdentityStatus {
  return {
    ...status,
    enabled: status.enrolled,
  };
}

export function enrichEnrollmentSession(session: Omit<EnrollmentSession, "qrCode">): EnrollmentSession {
  return {
    ...session,
    qrCode: session.enrollmentUrl,
  };
}

export function enrichChallengeSession(session: Omit<ChallengeSession, "qrCode">): ChallengeSession {
  return {
    ...session,
    qrCode: session.challengeUrl,
  };
}

export function normalizeEnrollmentTerminal(
  raw: Pick<EnrollmentPollResult, "status" | "identityStatus">,
): EnrollmentTerminalStatus | null {
  const s = String(raw.status ?? "").toLowerCase();
  if (s === "completed") return "COMPLETED";
  if (s === "expired") return "EXPIRED";
  if (s === "cancelled") return "CANCELLED";

  const ident = String(raw.identityStatus ?? "").toLowerCase();
  if (ident === "revoked" || ident === "suspended") return "FAILED";

  return null;
}

export function enrichEnrollmentPollResult(
  result: EnrollmentPollResult,
): EnrollmentPollResult {
  const terminal = normalizeEnrollmentTerminal({ status: result.status, identityStatus: result.identityStatus });
  return terminal ? { ...result, terminal } : result;
}

export function enrichConsumeChallengeResult(result: ConsumeChallengeResult): ConsumeChallengeResult {
  return {
    consumed: Boolean(result.consumed),
    challengeId: String(result.challengeId ?? ""),
    identityId: result.identityId ?? null,
  };
}

