import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import QRCode from "qrcode";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findUserByEmail, findUserById, verifyPassword } from "./db.js";
import { keyra, keyraConfigured } from "./keyra.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "keyra-partner-email-login-demo",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  }),
);

function requireKeyra(_req, res, next) {
  if (!keyraConfigured || !keyra) {
    return res.status(503).json({
      error: "keyra_not_configured",
      message: "Set KEYRA_PROJECT_ID, KEYRA_CLIENT_ID, KEYRA_CLIENT_SECRET in .env",
    });
  }
  next();
}

async function qrImageDataUrl(url) {
  return QRCode.toDataURL(url, { margin: 1, width: 280 });
}

function clearPending(req) {
  delete req.session.pendingUserId;
  delete req.session.pendingEnrollmentId;
  delete req.session.pendingChallengeId;
}

/** POST /login — email/password then KEYRA enrollment or challenge */
app.post("/login", requireKeyra, async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const status = await keyra.get2FAStatus(user.id);

    req.session.pendingUserId = user.id;

    if (!status.enabled) {
      const enrollment = await keyra.enable2FA(user.id);
      req.session.pendingEnrollmentId = enrollment.enrollmentId;

      const qrImage = await qrImageDataUrl(enrollment.qrCode);
      return res.json({
        requires2FASetup: true,
        userId: user.id,
        enrollmentId: enrollment.enrollmentId,
        qrCode: enrollment.qrCode,
        qrImageDataUrl: qrImage,
      });
    }

    const challenge = await keyra.startAuthentication(user.id);
    req.session.pendingChallengeId = challenge.challengeId;

    const qrImage = await qrImageDataUrl(challenge.qrCode);
    return res.json({
      requires2FA: true,
      userId: user.id,
      challengeId: challenge.challengeId,
      qrCode: challenge.qrCode,
      qrImageDataUrl: qrImage,
    });
  } catch (err) {
    console.error("[POST /login]", err);
    const message = err instanceof Error ? err.message : "Login failed";
    return res.status(500).json({ message });
  }
});

/** GET /auth/enrollment/:id — poll enrollment (browser → your API only) */
app.get("/auth/enrollment/:id", requireKeyra, async (req, res) => {
  const result = await keyra.pollEnrollment(req.params.id);
  return res.json(result);
});

/** POST /auth/enrollment/complete — finish setup and create session */
app.post("/auth/enrollment/complete", requireKeyra, async (req, res) => {
  const enrollmentId = String(req.body?.enrollmentId ?? "").trim();
  const userId = String(req.body?.userId ?? "").trim();

  if (!enrollmentId || !userId) {
    return res.status(400).json({ message: "enrollmentId and userId required" });
  }

  if (req.session.pendingUserId && req.session.pendingUserId !== userId) {
    return res.status(403).json({ message: "User mismatch" });
  }

  const result = await keyra.pollEnrollment(enrollmentId);
  if (result.terminal !== "COMPLETED" && result.status !== "completed") {
    return res.status(409).json({ message: "Enrollment not complete", result });
  }

  req.session.loggedIn = true;
  req.session.userId = userId;
  clearPending(req);

  return res.json({ success: true });
});

/** GET /auth/challenge/:id — poll challenge */
app.get("/auth/challenge/:id", requireKeyra, async (req, res) => {
  const result = await keyra.pollChallenge(req.params.id);
  return res.json(result);
});

/** POST /auth/challenge/consume — one-time token + session */
app.post("/auth/challenge/consume", requireKeyra, async (req, res) => {
  const challengeId = String(req.body?.challengeId ?? "").trim();
  const verificationToken = String(req.body?.verificationToken ?? "").trim();
  const userId = String(req.body?.userId ?? "").trim();

  if (!challengeId || !verificationToken || !userId) {
    return res.status(400).json({ message: "challengeId, verificationToken, and userId required" });
  }

  if (req.session.pendingUserId && req.session.pendingUserId !== userId) {
    return res.status(403).json({ message: "User mismatch" });
  }

  if (req.session.pendingChallengeId && req.session.pendingChallengeId !== challengeId) {
    return res.status(403).json({ message: "Challenge mismatch" });
  }

  await keyra.consumeChallenge(challengeId, verificationToken);

  req.session.loggedIn = true;
  req.session.userId = userId;
  clearPending(req);

  return res.json({ success: true });
});

/** GET /me — protected */
app.get("/me", (req, res) => {
  if (!req.session.loggedIn || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = findUserById(req.session.userId);
  return res.json({
    userId: req.session.userId,
    email: user?.email ?? null,
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, keyraConfigured });
});

app.listen(PORT, () => {
  console.log(`Partner email-login API http://localhost:${PORT}`);
  if (!keyraConfigured) {
    console.warn("KEYRA_* env vars missing — copy .env.example to .env");
  }
});
