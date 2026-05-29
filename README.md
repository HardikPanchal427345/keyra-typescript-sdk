# @keyra/server-sdk

Node.js SDK for KEYRA **verify after login**: your API starts verification, the user approves in the KEYRA UI, your API exchanges the code and validates the token.

**Pattern:** browser → your backend → this SDK → `auth.keyra.ie`  
(Browser-only? Use [`@keyra/web-sdk`](../keyra-web-sdk/README.md) instead.)

---

## 1. Install

```bash
npm install git+https://github.com/Ciright-Inc/keyra-server-sdk.git
```

Local path:

```bash
npm install file:../keyra-server-sdk
```

---

## 2. Credentials

From [developer.keyra.ie](https://developer.keyra.ie):

| You need | You do **not** need |
|----------|---------------------|
| **Publishable client ID** (`cp_test_…`) | Secret client ID |
| **Redirect URI** (registered exactly) | Secret key (`sk_…`) |
| **Auth backend URL** | |

Use the **same publishable ID** for start, token exchange, and validate.

```bash
KEYRA_AUTH_BACKEND_URL=https://auth.keyra.ie
KEYRA_PUBLISHABLE_CLIENT_ID=cp_test_xxxxxxxx
KEYRA_VERIFY_REDIRECT_URI=https://yourapp.com/callback
```

---

## 3. Code (3 steps)

```ts
import { createKeyraServer, generatePkce } from "@keyra/server-sdk";

const keyra = createKeyraServer({ baseUrl: process.env.KEYRA_AUTH_BACKEND_URL! });
const clientId = process.env.KEYRA_PUBLISHABLE_CLIENT_ID!;
const redirectUri = process.env.KEYRA_VERIFY_REDIRECT_URI!;

// A) Start — save state + codeVerifier in session, send authorize_url to browser
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

// B) Complete — after user returns with code + state
const tokens = await keyra.exchangeAuthorizationCode({
  code,
  code_verifier: pkce.codeVerifier,
  redirect_uri: redirectUri,
  client_id: clientId,
});

// C) Trust — always validate on the server
const { valid } = await keyra.validateVerification({
  verification_token: tokens.access_token,
  client_id: clientId,
});
if (!valid) throw new Error("Verification failed");
```

Optional: `getOAuthUserInfo(accessToken)` if the token response has no `user`.

---

## 4. Your routes (sketch)

| Route | Do this |
|-------|---------|
| Your login | Normal app auth |
| `POST /verify/start` | Step A → return `{ authorizeUrl: authorize_url }` |
| `POST /verify/complete` | Step B + C → mark session verified |
| Protected APIs | Require verified session |

Store **PKCE verifier** and **state** server-side only.

---

## 5. Run the demo

Full **login → verify → home** app (Express, no web SDK):

```bash
npm run build
cd examples/local-test-app
cp .env.example .env   # fill publishable client id
npm install
npm start
```

Open http://localhost:8082 — add `http://localhost:8082/callback` in the portal.

---

## API

| Function | What it does |
|----------|----------------|
| `createKeyraServer({ baseUrl })` | Client |
| `generatePkce()` | PKCE pair for step A |
| `createVerification(...)` | `POST /verify/start` |
| `exchangeAuthorizationCode(...)` | `POST /oauth/token` |
| `getOAuthUserInfo(token)` | `GET /oauth/userinfo` |
| `validateVerification(...)` | `POST /verify/validate` |
| `KeyraServerError` | API errors (`status`, `body`) |

---

## Common errors

| Error | Fix |
|-------|-----|
| `invalid_redirect_uri` | Register callback URL in portal (exact match) |
| `invalid_grant` | Use **publishable** client ID on token exchange |
| `invalid_state` | Compare callback `state` with session |

---

## Links

- [Java SDK](../keyra-java-sdk/README.md) — same flow on the JVM
- [Web SDK](../keyra-web-sdk/README.md) — browser-direct OAuth

MIT
