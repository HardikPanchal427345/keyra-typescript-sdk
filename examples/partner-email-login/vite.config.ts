import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  server: {
    port: 5173,
    proxy: {
      "/login": "http://localhost:3001",
      "/auth": "http://localhost:3001",
      "/me": "http://localhost:3001",
      "/logout": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
