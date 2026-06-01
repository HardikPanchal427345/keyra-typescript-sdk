export function enrichIdentityStatus(status) {
    return {
        ...status,
        enabled: status.enrolled,
    };
}
export function enrichEnrollmentSession(session) {
    return {
        ...session,
        qrCode: session.enrollmentUrl,
    };
}
export function enrichChallengeSession(session) {
    return {
        ...session,
        qrCode: session.challengeUrl,
    };
}
export function normalizeEnrollmentTerminal(raw) {
    const s = String(raw.status ?? "").toLowerCase();
    if (s === "completed")
        return "COMPLETED";
    if (s === "expired")
        return "EXPIRED";
    if (s === "cancelled")
        return "CANCELLED";
    const ident = String(raw.identityStatus ?? "").toLowerCase();
    if (ident === "revoked" || ident === "suspended")
        return "FAILED";
    return null;
}
export function enrichEnrollmentPollResult(result) {
    const terminal = normalizeEnrollmentTerminal({ status: result.status, identityStatus: result.identityStatus });
    return terminal ? { ...result, terminal } : result;
}
export function enrichConsumeChallengeResult(result) {
    return {
        consumed: Boolean(result.consumed),
        challengeId: String(result.challengeId ?? ""),
        identityId: result.identityId ?? null,
    };
}
