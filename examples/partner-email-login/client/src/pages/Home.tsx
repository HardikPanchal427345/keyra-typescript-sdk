import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout } from "../api";

export function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then((me) => setEmail(me.email))
      .catch(() => {
        setError("Not signed in");
        navigate("/", { replace: true });
      });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <h1>Home</h1>
      {error ? <p className="error">{error}</p> : null}
      <p className="muted">You are signed in{email ? ` as ${email}` : ""}.</p>
      <button type="button" className="primary" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
