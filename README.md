# @keyra/server-sdk

Node.js SDK for KEYRA on **your backend**. Two integrations:

| Integration | When to use | Credentials |
|-------------|-------------|-------------|
| **Partner 2FA** | You already log users in (email/password, SSO). KEYRA enrolls their phone once, then approves each sign-in. | Secret `clientId` + `sk_*` + `projectId` |
| **Authorize / verify** | KEYRA is a post-login step (popup/redirect + OAuth code). | Publishable `cp_*` + redirect URI |

Browser UI for both flows runs on **get-started** (QR). Your server calls this SDK; never expose secret keys to the SPA.

---

## Install

```bash
npm install git+https://github.com/Ciright-Inc/keyra-server-sdk.git
```

```bash
cd keyra-server-sdk && npm run build   # if installing from a clone
```

---

# Partner 2FA

**Your login** → check KEYRA status → **enroll** (first time) or **verify sign-in** (every later login).

**Demo:** [examples/partner-email-login](examples/partner-email-login/) — `demo@example.com` / `password`

## Setup

**1. Developer portal** — secret API key row: `projectId`, `clientId` (`cp_test_…`), `clientSecret` (`sk_test_…`).

**2. Server `.env`**

```bash
KEYRA_BASE_URL=https://auth.keyra.ie
KEYRA_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
KEYRA_CLIENT_ID=cp_test_xxxxxxxx
KEYRA_CLIENT_SECRET=sk_test_xxxxxxxx
```

**3. Auth backend** (operator / local)

```bash
IDENTITY_2FA_ENABLED=true
KEYRA_ENROLL_BASE_URL=https://get-started.keyra.ie
KEYRA_CHALLENGE_BASE_URL=https://get-started.keyra.ie
```

Use a **LAN IP** in those URLs if users scan QR on a phone (not `localhost`).

**4. Create the client**

```ts
import { createKeyraPartner2FA } from "@keyra/server-sdk";

const keyra = createKeyraPartner2FA({
  baseUrl: process.env.KEYRA_BASE_URL!,
  projectId: process.env.KEYRA_PROJECT_ID!,
  clientId: process.env.KEYRA_CLIENT_ID!,
  clientSecret: process.env.KEYRA_CLIENT_SECRET!,
});
```

`externalUserId` = stable id in **your** system (1–128 chars: `A–Z`, `a–z`, `0–9`, `._-`).

---

## Enrollment flow (first-time user)

Run when `get2FAStatus(externalUserId).enabled === false`.

| Step | Where | What to do |
|------|--------|------------|
| **1** | Your API | User passes **your** login (email/password, etc.). |
| **2** | Your API | `const status = await keyra.get2FAStatus(externalUserId)` → if `status.enabled`, skip to [Verification flow](#verification-flow-return-login). |
| **3** | Your API | `const enrollment = await keyra.enable2FA(externalUserId, { returnUrl?: "..." })` → save `enrollment.enrollmentId` server-side. |
| **4** | Your UI | Show QR encoding `enrollment.qrCode` (same URL as `enrollment.enrollmentUrl`). Link expires in ~10 minutes. |
| **5** | User phone | Scan QR → get-started `/enroll/:token` → enter phone → OTP. (Public pages — not SDK calls.) |
| **6** | Your API | Poll until done: `await keyra.waitForEnrollment(enrollment.enrollmentId)` or loop `pollEnrollment`. |
| **7** | Your API | When `terminal === "COMPLETED"` (or `status === "completed"`), create **your** app session → home. |

**Enrollment code**

```ts
const status = await keyra.get2FAStatus(externalUserId);
if (status.enabled) {
  // already enrolled → use verification flow below
}

const enrollment = await keyra.enable2FA(externalUserId);
// Return to browser: { mode: "setup", enrollmentId, qrCode: enrollment.qrCode }

const done = await keyra.waitForEnrollment(enrollment.enrollmentId, {
  timeoutMs: 600_000,
  intervalMs: 1500,
});

if (done.terminal !== "COMPLETED") {
  throw new Error(`Enrollment failed: ${done.terminal ?? done.status}`);
}
// User is enrolled — create your session
```

**Poll statuses (in progress):** `pending` → `phone_sent` → `verified` → `completed`  
**Terminal:** `COMPLETED` | `EXPIRED` | `CANCELLED` | `FAILED` (`waitForEnrollment` throws typed errors)

**Your routes (sketch)**

| Route | SDK |
|-------|-----|
| `POST /login` | `get2FAStatus` → `enable2FA` if not enrolled |
| `GET /auth/enrollment/:id` | `pollEnrollment` |
| `POST /auth/enrollment/complete` | After `COMPLETED`, your session cookie |

---

## Verification flow (return login)

Run when `get2FAStatus(externalUserId).enabled === true` (user already enrolled).

| Step | Where | What to do |
|------|--------|------------|
| **1** | Your API | User passes **your** login. |
| **2** | Your API | `get2FAStatus` → `enabled === true`. |
| **3** | Your API | `const challenge = await keyra.startAuthentication(externalUserId)` → save `challenge.challengeId`. |
| **4** | Your UI | Show QR from `challenge.qrCode`. |
| **5** | User phone | Scan QR → get-started challenge page → **Approve** (or OTP first if no KEYRA session on that device). |
| **6** | Your API | `const ch = await keyra.waitForChallengeApproval(challenge.challengeId)` (or `pollChallenge`). |
| **7** | Your API | `await keyra.consumeChallenge(challenge.challengeId, ch.verificationToken!)` — **once**. |
| **8** | Your API | Create **your** app session → home. |

**Verification code**

```ts
const status = await keyra.get2FAStatus(externalUserId);
if (!status.enabled) {
  // use enrollment flow above
}

const challenge = await keyra.startAuthentication(externalUserId);
// Return: { mode: "verify", challengeId, qrCode: challenge.qrCode }

const approved = await keyra.waitForChallengeApproval(challenge.challengeId, {
  timeoutMs: 120_000,
});

await keyra.consumeChallenge(challenge.challengeId, approved.verificationToken!);
// Create your session
```

**Challenge `status`:** `pending` → `approved` | `denied` | `expired`

**Your routes (sketch)**

| Route | SDK |
|-------|-----|
| `POST /login` | `get2FAStatus` → `startAuthentication` if enrolled |
| `GET /auth/challenge/:id` | `pollChallenge` |
| `POST /auth/challenge/consume` | `consumeChallenge` + your session |

**OTP vs approve-only:** After enrollment OTP, get-started sets `simsecure_session`. Same phone + same host on the next challenge can show **Approve / Decline** without OTP.

---

## Partner 2FA — API

| Method | HTTP |
|--------|------|
| `get2FAStatus(externalUserId)` | `POST /v1/identities/status` |
| `enable2FA(externalUserId, { returnUrl? })` | `POST /v1/identities/enroll` |
| `pollEnrollment` / `waitForEnrollment` | `GET /v1/identities/enroll/:id/status` |
| `startAuthentication(externalUserId, { nonce? })` | `POST /v1/auth/challenge` |
| `pollChallenge` / `waitForChallengeApproval` | `GET /v1/auth/challenge/:id` |
| `consumeChallenge(challengeId, verificationToken)` | `POST .../consume` |
| `disable2FA` / recovery helpers | see OpenAPI |

OpenAPI: [partner-2fa-v1.yaml](../simsecure-auth-session/docs/openapi/partner-2fa-v1.yaml)

---

# Authorize / verify (OAuth)

**Your login** → KEYRA verification UI (popup/redirect) → your API exchanges code → validate token.

**Demo:** [examples/local-test-app](examples/local-test-app/) — http://localhost:8082

Does **not** use enrollment APIs above. Uses publishable client ID + PKCE.

## Setup

```bash
KEYRA_AUTH_BACKEND_URL=https://auth.keyra.ie
KEYRA_PUBLISHABLE_CLIENT_ID=cp_test_xxxxxxxx
KEYRA_VERIFY_REDIRECT_URI=https://yourapp.com/callback
```

Register the redirect URI exactly in the developer portal.

```ts
import { createKeyraServer, generatePkce } from "@keyra/server-sdk";

const keyra = createKeyraServer({ baseUrl: process.env.KEYRA_AUTH_BACKEND_URL! });
const clientId = process.env.KEYRA_PUBLISHABLE_CLIENT_ID!;
const redirectUri = process.env.KEYRA_VERIFY_REDIRECT_URI!;
```

---

## Verification flow (authorize / verify)

There is no separate “enrollment” step in this mode — the user verifies in the KEYRA authorize UI after your app login.

| Step | Where | What to do |
|------|--------|------------|
| **1** | Your API | User completes **your** login (session/JWT). |
| **2** | Your API | `generatePkce()` + `crypto.randomUUID()` for `state`. Store `codeVerifier` + `state` in **server session**. |
| **3** | Your API | `createVerification({ client_id, redirect_uri, state, code_challenge, code_challenge_method: "S256", mode: "popup" })` → return `authorize_url` to the browser. |
| **4** | Browser | Open `authorize_url` (popup or redirect). User completes get-started authorize UI. |
| **5** | Browser → Your API | Callback with `code` + `state` (or `postMessage` in popup). |
| **6** | Your API | Match `state` to session. `exchangeAuthorizationCode({ code, code_verifier, redirect_uri, client_id })`. |
| **7** | Your API | `validateVerification({ verification_token: access_token, client_id })` → require `valid === true`. |
| **8** | Your API | Mark session verified; optional `getOAuthUserInfo(accessToken)` if token has no `user`. |

**Code**

```ts
// Step 2–3
const pkce = generatePkce();
const state = crypto.randomUUID();
const { authorize_url } = await keyra.createVerification({
  client_id: clientId,
  redirect_uri: redirectUri,
  state,
  code_challenge: pkce.codeChallenge,
  code_challenge_method: "S256",
  mode: "popup",
});

// Step 6–7 (after callback)
const tokens = await keyra.exchangeAuthorizationCode({
  code,
  code_verifier: pkce.codeVerifier,
  redirect_uri: redirectUri,
  client_id: clientId,
});

const { valid } = await keyra.validateVerification({
  verification_token: tokens.access_token,
  client_id: clientId,
});
if (!valid) throw new Error("Verification failed");
```

**Your routes (sketch)**

| Route | SDK |
|-------|-----|
| `POST /api/login` | Your auth |
| `POST /api/verify/start` | `generatePkce` + `createVerification` |
| `POST /api/verify/complete` | `exchangeAuthorizationCode` + `validateVerification` |
| `GET /api/session` | Your session (verified flag) |

---

## Authorize / verify — API

| Method | HTTP |
|--------|------|
| `createKeyraServer({ baseUrl })` | — |
| `generatePkce()` | local |
| `createVerification(...)` | `POST /verify/start` |
| `exchangeAuthorizationCode(...)` | `POST /oauth/token` |
| `getOAuthUserInfo(token)` | `GET /oauth/userinfo` |
| `validateVerification(...)` | `POST /verify/validate` |

Use the **same publishable** `client_id` for steps 3, 6, and 7.

---

## Run demos

**Partner 2FA**

```bash
npm run build
cd examples/partner-email-login && cp .env.example .env && npm install && npm run dev
```

**Authorize / verify**

```bash
npm run build
cd examples/local-test-app && cp .env.example .env && npm install && npm start
```

Portal callback for local-test-app: `http://localhost:8082/callback`

---

## Troubleshooting

| Issue | Flow | Fix |
|-------|------|-----|
| `401 invalid_client` | Partner | Secret `clientId` + `clientSecret` as Bearer |
| QR opens wrong host | Partner | Set `KEYRA_ENROLL_BASE_URL` / `KEYRA_CHALLENGE_BASE_URL` on auth backend |
| Challenge always asks OTP | Partner | User needs enroll on same host; check `simsecure_session` + phone |
| `invalid_grant` | OAuth | Publishable ID on token exchange (not secret client id) |
| `invalid_redirect_uri` | OAuth | Register exact callback in portal |
| `invalid_state` | OAuth | Store and compare `state` server-side |

---

## Links

- [Java SDK](../keyra-java-sdk/README.md)
- [@keyra/web-sdk](../keyra-web-sdk/README.md) — browser OAuth only (no Partner 2FA)

MIT
