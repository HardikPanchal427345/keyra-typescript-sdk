import { createKeyraVerifyClient } from "@keyra/web-sdk";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");

const KEYS = {
  authDomain: "demo_auth_domain",
  clientId: "demo_client_id",
  redirectUri: "demo_redirect_uri",
  loggedIn: "demo_logged_in",
  verification: "demo_verification_result",
} as const;

type VerificationResult = {
  verificationToken?: string;
  accessToken?: string;
  expiresIn?: number;
  method?: string;
  status?: string;
  user?: unknown;
};

let cachedClient: ReturnType<typeof createKeyraVerifyClient> | null = null;
let cachedKey = "";

function defaults() {
  return {
    authDomain: localStorage.getItem(KEYS.authDomain) ?? "https://auth.keyra.ie",
    clientId: localStorage.getItem(KEYS.clientId) ?? "",
    redirectUri: localStorage.getItem(KEYS.redirectUri) ?? `${window.location.origin}/callback`,
  };
}

function getClient(config?: { authDomain?: string; clientId?: string; redirectUri?: string }) {
  const d = defaults();
  const authDomain = (config?.authDomain ?? d.authDomain).trim();
  const clientId = (config?.clientId ?? d.clientId).trim();
  const redirectUri = (config?.redirectUri ?? d.redirectUri).trim();
  if (!authDomain || !clientId || !redirectUri) throw new Error("authDomain, clientId, redirectUri are required");
  const key = JSON.stringify({ authDomain, clientId, redirectUri });
  localStorage.setItem(KEYS.authDomain, authDomain);
  localStorage.setItem(KEYS.clientId, clientId);
  localStorage.setItem(KEYS.redirectUri, redirectUri);
  if (!cachedClient || cachedKey !== key) {
    cachedClient = createKeyraVerifyClient({
      domain: authDomain,
      clientId,
      redirectUri,
    });
    cachedKey = key;
  }
  return cachedClient;
}

function saveVerification(result: unknown) {
  localStorage.setItem(KEYS.verification, JSON.stringify(result));
}

function loadVerification(): VerificationResult | null {
  const raw = localStorage.getItem(KEYS.verification);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VerificationResult;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return localStorage.getItem(KEYS.loggedIn) === "1";
}

function setLoggedIn(value: boolean) {
  if (value) localStorage.setItem(KEYS.loggedIn, "1");
  else localStorage.removeItem(KEYS.loggedIn);
}

function html(strings: TemplateStringsArray, ...vals: unknown[]) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ""), "");
}

function route(path: string) {
  window.history.pushState({}, "", path);
  render();
}

function currentPath() {
  return window.location.pathname;
}

function renderLoginPage() {
  const d = defaults();
  app.innerHTML = html`
    <div class="card">
      <h1>Demo Login</h1>
      <p>Simulated app login step before KEYRA verification.</p>
      <label>Email</label>
      <input id="email" placeholder="user@example.com" />
      <label>Password</label>
      <input id="password" type="password" placeholder="••••••••" />
      <label>KEYRA Auth Domain</label>
      <input id="domain" value="${d.authDomain}" />
      <label>KEYRA Client ID</label>
      <input id="clientId" value="${d.clientId}" placeholder="cp_test_xxx" />
      <label>Redirect URI</label>
      <input id="redirectUri" value="${d.redirectUri}" />
      <div class="actions">
        <button id="loginBtn">Login</button>
      </div>
    </div>
  `;
  document.querySelector<HTMLButtonElement>("#loginBtn")?.addEventListener("click", () => {
    const domain = (document.querySelector<HTMLInputElement>("#domain")?.value ?? "").trim();
    const clientId = (document.querySelector<HTMLInputElement>("#clientId")?.value ?? "").trim();
    const redirectUri = (document.querySelector<HTMLInputElement>("#redirectUri")?.value ?? "").trim();
    getClient({ authDomain: domain, clientId, redirectUri });
    setLoggedIn(true);
    route("/verify");
  });
}

function renderVerifyPage() {
  if (!isLoggedIn()) {
    route("/");
    return;
  }
  app.innerHTML = html`
    <div class="card">
      <h1>Step 2: KEYRA Verification</h1>
      <p>Click below to open hosted KEYRA popup. QR is shown in popup and approved from mobile.</p>
      <div class="actions">
        <button id="verifyBtn">Start Verification (QR Popup)</button>
        <button id="backBtn" class="secondary">Back</button>
      </div>
    </div>
    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>
  `;
  const out = document.querySelector<HTMLElement>("#out");
  const setOut = (v: unknown) => {
    if (out) out.textContent = typeof v === "string" ? v : JSON.stringify(v, null, 2);
  };
  document.querySelector<HTMLButtonElement>("#verifyBtn")?.addEventListener("click", async () => {
    try {
      setOut("Verification running...");
      const result = await getClient().verifyWithPopup();
      saveVerification(result);
      route("/home");
    } catch (err) {
      setOut({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });
  document.querySelector<HTMLButtonElement>("#backBtn")?.addEventListener("click", () => route("/"));
}

function renderCallbackPage() {
  app.innerHTML = html`
    <div class="card">
      <h1>Completing Verification</h1>
      <pre id="out">Handling callback...</pre>
    </div>
  `;
  const out = document.querySelector<HTMLElement>("#out");
  const setOut = (v: unknown) => {
    if (out) out.textContent = typeof v === "string" ? v : JSON.stringify(v, null, 2);
  };
  void getClient()
    .handleRedirectCallback()
    .then((result) => {
      saveVerification(result);
      route("/home");
    })
    .catch((err) => {
      setOut({ ok: false, error: err instanceof Error ? err.message : String(err) });
    });
}

function renderHomePage() {
  if (!isLoggedIn()) {
    route("/");
    return;
  }
  const verification = loadVerification();
  app.innerHTML = html`
    <div class="card">
      <h1>Home</h1>
      <p>Login + verification completed successfully.</p>
      <div class="actions">
        <button id="logoutBtn" class="secondary">Logout</button>
      </div>
    </div>
    <div class="card">
      <h2>Verification Result</h2>
      <pre>${JSON.stringify(verification, null, 2)}</pre>
    </div>
  `;
  document.querySelector<HTMLButtonElement>("#logoutBtn")?.addEventListener("click", () => {
    setLoggedIn(false);
    localStorage.removeItem(KEYS.verification);
    route("/");
  });
}

function render() {
  const path = currentPath();
  const query = new URLSearchParams(window.location.search);
  const hasOauth = Boolean(query.get("code") && query.get("state"));
  if (path === "/callback" || hasOauth) {
    renderCallbackPage();
    return;
  }
  if (path === "/verify") {
    renderVerifyPage();
    return;
  }
  if (path === "/home") {
    renderHomePage();
    return;
  }
  renderLoginPage();
}

window.addEventListener("popstate", () => render());
render();
