# Authorize / verify demo

Express + vanilla frontend — **OAuth verification flow** only.

Main guide: [README — Authorize / verify](../../README.md#authorize--verify-oauth)

```bash
npm run build   # from repo root
cp .env.example .env
npm install
npm start
```

http://localhost:8082 — register `http://localhost:8082/callback` in the portal.

For **Partner 2FA** (enrollment + challenge), see [partner-email-login](../partner-email-login/README.md).
