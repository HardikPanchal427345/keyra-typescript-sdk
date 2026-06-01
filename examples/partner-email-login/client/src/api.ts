export type LoginResponse =
  | {
      requires2FASetup: true;
      userId: string;
      enrollmentId: string;
      qrCode: string;
      qrImageDataUrl: string;
    }
  | {
      requires2FA: true;
      userId: string;
      challengeId: string;
      qrCode: string;
      qrImageDataUrl: string;
    }
  | { success?: boolean };

export type EnrollmentPollResult = {
  enrollmentId: string;
  status: string;
  identityId: string;
  identityStatus: string;
  completedAt?: string | null;
  terminal?: "COMPLETED" | "EXPIRED" | "FAILED" | "CANCELLED";
};

export type ChallengePollResult = {
  challengeId: string;
  status: string;
  identityId?: string;
  verificationToken?: string;
  pollAfterMs?: number;
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const body = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return body;
}

export function login(email: string, password: string) {
  return json<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function pollEnrollment(enrollmentId: string) {
  return json<EnrollmentPollResult>(`/auth/enrollment/${encodeURIComponent(enrollmentId)}`);
}

export function completeEnrollment(enrollmentId: string, userId: string) {
  return json<{ success: boolean }>("/auth/enrollment/complete", {
    method: "POST",
    body: JSON.stringify({ enrollmentId, userId }),
  });
}

export function pollChallenge(challengeId: string) {
  return json<ChallengePollResult>(`/auth/challenge/${encodeURIComponent(challengeId)}`);
}

export function consumeChallenge(challengeId: string, verificationToken: string, userId: string) {
  return json<{ success: boolean }>("/auth/challenge/consume", {
    method: "POST",
    body: JSON.stringify({ challengeId, verificationToken, userId }),
  });
}

export function getMe() {
  return json<{ userId: string; email: string | null }>("/me");
}

export function logout() {
  return json<{ ok: boolean }>("/logout", { method: "POST" });
}
