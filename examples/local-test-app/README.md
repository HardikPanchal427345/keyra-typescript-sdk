# TypeScript server SDK — local verify demo

Reference implementation for **login → verify → home** using **@keyra/server-sdk** only (no web SDK).

Full integration guide: [../../README.md](../../README.md)

## Architecture

```
Browser (public/)  →  Express /api/*  →  @keyra/server-sdk  →  auth backend
Browser opens authorize_url only (get-started UI)
```

## Flow

| Step | Route | SDK |
|------|-------|-----|
| 1 Login | `POST /api/login` | (simulated) |
| 2 Start | `POST /api/verify/start` | `generatePkce()`, `createVerification()` |
| 3 UI | popup/redirect | `authorizeUrl` from response |
| 4 Complete | `POST /api/verify/complete` | `exchangeAuthorizationCode()`, `validateVerification()` |
| 5 Home | `GET /api/session` | express-session |

## Credentials

| `.env` variable | Portal value |
|-----------------|--------------|
| `KEYRA_PUBLISHABLE_CLIENT_ID` | **Publishable client ID** only |

**Not required:** secret client ID, secret key (`sk_*`).

See [server SDK credentials guide](../../README.md#credentials-what-to-enter-where).

## Setup

1. Auth backend (`KEYRA_AUTH_BACKEND_URL`, e.g. `http://localhost:4000`)
2. get-started authorize UI reachable
3. Developer portal redirect URI: **`http://localhost:8082/callback`** (exact)
4. `KEYRA_PUBLISHABLE_CLIENT_ID` set in `.env`

## Run

```bash
# Build SDK first
cd ../..
npm run build

cd examples/local-test-app
cp .env.example .env
npm install
npm start
```

Open [http://localhost:8082](http://localhost:8082)

Use `npm run dev` for `--watch` on `server.js`.

## Environment

| Variable | Credential type |
|----------|-----------------|
| `KEYRA_PUBLISHABLE_CLIENT_ID` | Publishable client ID |
| `KEYRA_AUTH_BACKEND_URL` | Auth API base |
| `KEYRA_VERIFY_REDIRECT_URI` | Redirect URI |
| `PORT` | `8082` |
| `SESSION_SECRET` | Express session (your app) |

## Key source files

- `server.js` — API + SDK
- `public/app.js` — frontend (calls `/api/*` only)
