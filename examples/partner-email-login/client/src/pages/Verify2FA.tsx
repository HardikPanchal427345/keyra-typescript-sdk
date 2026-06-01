import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { consumeChallenge, pollChallenge, type LoginResponse } from "../api";

type VerifyState = Extract<LoginResponse, { requires2FA: true }>;

export function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyState | null;

  const [statusText, setStatusText] = useState("Waiting for approval…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state?.challengeId || !state?.userId) {
      navigate("/", { replace: true });
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const result = await pollChallenge(state.challengeId);
        setStatusText(`Status: ${result.status}`);

        if (result.status === "denied") {
          window.clearInterval(interval);
          setError("Sign-in was declined.");
          return;
        }

        if (result.status === "expired") {
          window.clearInterval(interval);
          setError("Approval request expired. Sign in again.");
          return;
        }

        if (result.status === "approved" && result.verificationToken) {
          window.clearInterval(interval);
          await consumeChallenge(state.challengeId, result.verificationToken, state.userId);
          navigate("/home", { replace: true });
        }
      } catch (err) {
        window.clearInterval(interval);
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [navigate, state]);

  if (!state) return null;

  return (
    <div className="app-shell">
      <h1>Verify sign-in</h1>
      <p className="muted">Scan the QR code on your phone and approve this sign-in.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="qr-wrap">
        <img src={state.qrImageDataUrl} alt="Challenge QR code" />
      </div>

      <p className="status">{statusText}</p>
    </div>
  );
}
