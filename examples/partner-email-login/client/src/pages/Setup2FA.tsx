import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeEnrollment, pollEnrollment, type LoginResponse } from "../api";

type SetupState = Extract<LoginResponse, { requires2FASetup: true }>;

export function Setup2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SetupState | null;

  const [statusText, setStatusText] = useState("Waiting for enrollment…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state?.enrollmentId || !state?.userId) {
      navigate("/", { replace: true });
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const result = await pollEnrollment(state.enrollmentId);
        setStatusText(`Status: ${result.status}${result.terminal ? ` (${result.terminal})` : ""}`);

        if (result.terminal === "COMPLETED" || result.status === "completed") {
          window.clearInterval(interval);
          await completeEnrollment(state.enrollmentId, state.userId);
          navigate("/home", { replace: true });
        }

        if (result.terminal === "EXPIRED" || result.terminal === "CANCELLED" || result.terminal === "FAILED") {
          window.clearInterval(interval);
          setError(`Enrollment ended: ${result.terminal ?? result.status}`);
        }
      } catch (err) {
        window.clearInterval(interval);
        setError(err instanceof Error ? err.message : "Polling failed");
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [navigate, state]);

  if (!state) return null;

  return (
    <div className="app-shell">
      <h1>Enable KEYRA 2FA</h1>
      <p className="muted">Scan this QR code with your phone to enroll your verification factor.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="qr-wrap">
        <img src={state.qrImageDataUrl} alt="Enrollment QR code" />
      </div>

      <p className="status">{statusText}</p>
    </div>
  );
}
