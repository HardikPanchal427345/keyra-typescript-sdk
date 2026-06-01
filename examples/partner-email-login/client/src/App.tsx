import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Setup2FA } from "./pages/Setup2FA";
import { Verify2FA } from "./pages/Verify2FA";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/setup-2fa" element={<Setup2FA />} />
      <Route path="/verify-2fa" element={<Verify2FA />} />
      <Route path="/home" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
