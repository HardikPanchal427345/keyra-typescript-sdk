import dotenv from "dotenv";
import crypto from "node:crypto";
import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createKeyraServer, generatePkce, KeyraServerError } from "@keyra/server-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });
const PORT = Number(process.env.PORT ?? 8082);
const BASE_URL = process.env.KEYRA_AUTH_BACKEND_URL ?? "http://localhost:4000";
const PUBLISHABLE_CLIENT_ID = process.env.KEYRA_PUBLISHABLE_CLIENT_ID ?? "";
const VERIFY_REDIRECT_URI = process.env.KEYRA_VERIFY_REDIRECT_URI ?? `http://localhost:${PORT}/callback`;

const keyra = createKeyraServer({ baseUrl: BASE_URL });

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "keyra-ts-demo-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  }),
);
app.use(express.static(path.join(__dirname, "public")));

function mask(id) {
  if (!id) return "(not set)";
  return id.length <= 12 ? id : `${id.slice(0, 10)}…`;
}

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.status(401).json({ error: "login_required" });
  next();
}

app.get("/api/config", (_req, res) => {
  res.json({
    authBackendUrl: BASE_URL,
    publishableClientId: mask(PUBLISHABLE_CLIENT_ID),
    verifyRedirectUri: VERIFY_REDIRECT_URI,
    flow: "login -> POST /api/verify/start -> authorize UI -> POST /api/verify/complete -> home",
  });
});

app.post("/api/login", (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });
  req.session.loggedIn = true;
  req.session.email = email;
  delete req.session.verifyState;
  delete req.session.verifyVerifier;
  delete req.session.verifyId;
  delete req.session.verifyRedirect;
  delete req.session.accessToken;
  delete req.session.user;
  delete req.session.validation;
  res.json({ ok: true, email, next: "/verify" });
});

app.post("/api/verify/start", requireLogin, async (req, res) => {
  if (!PUBLISHABLE_CLIENT_ID) return res.status(400).json({ error: "publishable_client_id_missing" });
  try {
    const mode = String(req.body?.mode ?? "popup").trim() || "popup";
    const pkce = generatePkce();
    const state = crypto.randomUUID();
    const start = await keyra.createVerification({
      client_id: PUBLISHABLE_CLIENT_ID,
      redirect_uri: VERIFY_REDIRECT_URI,
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
      response_type: "code",
      mode,
      scope: "openid profile phone",
    });
    if (!start.authorize_url) return res.status(502).json({ error: "missing_authorize_url" });
    req.session.verifyState = state;
    req.session.verifyVerifier = pkce.codeVerifier;
    req.session.verifyId = start.verification_id;
    req.session.verifyRedirect = VERIFY_REDIRECT_URI;
    res.json({
      ok: true,
      verificationId: start.verification_id,
      authorizeUrl: start.authorize_url,
      state,
      status: start.status,
      expiresIn: start.expires_in,
    });
  } catch (err) {
    respondKeyraError(res, err);
  }
});

app.post("/api/verify/complete", requireLogin, async (req, res) => {
  const code = String(req.body?.code ?? "").trim();
  const state = String(req.body?.state ?? "").trim();
  if (!code || !state) return res.status(400).json({ error: "code_and_state_required" });
  if (!req.session.verifyState || !req.session.verifyVerifier || !req.session.verifyRedirect) {
    return res.status(400).json({ error: "verification_not_started" });
  }
  if (req.session.verifyState !== state) return res.status(400).json({ error: "invalid_state" });
  if (req.session.accessToken) {
    return res.json({ ok: true, alreadyCompleted: true, next: "/home" });
  }
  try {
    const tokens = await keyra.exchangeAuthorizationCode({
      code,
      code_verifier: req.session.verifyVerifier,
      redirect_uri: req.session.verifyRedirect,
      client_id: PUBLISHABLE_CLIENT_ID,
    });
    const accessToken = tokens.access_token;
    let user = tokens.user ?? null;
    if (!user) user = await keyra.getOAuthUserInfo(accessToken);
    const validation = await keyra.validateVerification({
      verification_token: accessToken,
      client_id: PUBLISHABLE_CLIENT_ID,
    });
    req.session.accessToken = accessToken;
    req.session.user = user;
    req.session.validation = validation;
    res.json({
      ok: true,
      accessTokenPreview: previewToken(accessToken),
      expiresIn: tokens.expires_in ?? null,
      user,
      validation: {
        valid: validation.valid,
        verificationId: validation.verification_id,
      },
      next: "/home",
    });
  } catch (err) {
    respondKeyraError(res, err);
  }
});

app.get("/api/session", requireLogin, (req, res) => {
  res.json({
    loggedIn: true,
    email: req.session.email,
    verified: Boolean(req.session.accessToken),
    accessTokenPreview: req.session.accessToken ? previewToken(req.session.accessToken) : null,
    user: req.session.user ?? null,
    validation: req.session.validation ?? null,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

const spaPaths = ["/", "/verify", "/home", "/callback"];
for (const p of spaPaths) {
  app.get(p, (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
}

app.listen(PORT, () => {
  console.log(`KEYRA TypeScript SDK demo: http://localhost:${PORT}`);
});

function previewToken(token) {
  if (!token || token.length <= 12) return token;
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function respondKeyraError(res, err) {
  if (err instanceof KeyraServerError) {
    const body = (err.body && typeof err.body === "object" ? err.body : {}) ;
    return res.status(err.status).json({
      status: err.status,
      error: body.error ?? err.message,
      error_description: body.error_description,
      hint: "Check publishable client id and redirect URI in developer portal.",
      raw_body: body,
    });
  }
  res.status(500).json({ error: err?.message ?? "server_error" });
}
