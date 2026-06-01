import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createKeyraPartner2FA } from "@keyra/server-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const baseUrl = process.env.KEYRA_BASE_URL ?? "https://auth.keyra.ie";
const projectId = process.env.KEYRA_PROJECT_ID ?? "";
const clientId = process.env.KEYRA_CLIENT_ID ?? "";
const clientSecret = process.env.KEYRA_CLIENT_SECRET ?? "";

export const keyraConfigured =
  Boolean(projectId) && Boolean(clientId) && Boolean(clientSecret);

export const keyra = keyraConfigured
  ? createKeyraPartner2FA({
      baseUrl,
      projectId,
      clientId,
      clientSecret,
      timeoutMs: Number(process.env.KEYRA_TIMEOUT_MS ?? 20000),
    })
  : null;
