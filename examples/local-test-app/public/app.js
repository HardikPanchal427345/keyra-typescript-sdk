const SUCCESS_MSG = "KEYRA_AUTH_SUCCESS";
const ERROR_MSG = "KEYRA_AUTH_ERROR";

const app = document.getElementById("app");
let completingVerification = false;

function pretty(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      json.error_description ||
      json.error ||
      json.hint ||
      (typeof json.message === "string" ? json.message : pretty(json));
    throw new Error(message);
  }
  return json;
}

function route() {
  const path = window.location.pathname;
  if (path === "/verify") return renderVerifyPage();
  if (path === "/callback") return renderCallbackPage();
  if (path === "/home") return renderHomePage();
  return renderLoginPage();
}

function renderLoginPage() {
  app.innerHTML = `
    <div class="card">
      <span class="badge">TypeScript server SDK demo — browser calls Node APIs only</span>
      <h1>Step 1: App Login</h1>
      <p>Simulate app login. KEYRA verification runs on the Node server via <code>@keyra/server-sdk</code>.</p>
      <label>Email</label>
      <input id="email" placeholder="user@example.com" />
      <label>Password</label>
      <input id="password" type="password" placeholder="••••••••" />
      <div class="actions">
        <button id="loginBtn">Continue</button>
      </div>
    </div>
    <div class="card">
      <h2>Server config</h2>
      <pre id="config">Loading...</pre>
    </div>
    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>
  `;

  void api("/api/config")
    .then((cfg) => {
      document.getElementById("config").textContent = pretty(cfg);
    })
    .catch((err) => {
      document.getElementById("config").textContent = err.message;
    });

  const out = document.getElementById("out");
  document.getElementById("loginBtn").addEventListener("click", async () => {
    try {
      out.textContent = "POST /api/login ...";
      const result = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      });
      out.textContent = pretty(result);
      window.location.href = "/verify";
    } catch (err) {
      out.textContent = pretty({ ok: false, error: err.message });
    }
  });
}

function renderVerifyPage() {
  app.innerHTML = `
    <div class="card">
      <h1>Step 2: KEYRA Verify</h1>
      <p>Node calls <code>createVerification()</code> then opens the authorize URL.</p>
      <div class="actions">
        <button id="verifyPopup">Verify (popup)</button>
        <button id="verifyRedirect" class="secondary">Verify (redirect)</button>
        <button id="backLogin" class="secondary">Back</button>
      </div>
    </div>
    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>
  `;

  const out = document.getElementById("out");

  async function start(mode) {
    out.textContent = `POST /api/verify/start (${mode})...`;
    const start = await api("/api/verify/start", {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
    out.textContent = pretty(start);
    if (mode === "redirect") {
      window.location.href = start.authorizeUrl;
      return;
    }
    openPopupFlow(start);
  }

  function openPopupFlow(start) {
    const popup = window.open(start.authorizeUrl, "keyra_verify_popup", "width=520,height=760,left=120,top=60");
    if (!popup) throw new Error("Popup blocked");

    const expectedOrigin = new URL(start.authorizeUrl).origin;
    const timeout = window.setTimeout(() => cleanup(), 120000);
    const poll = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        out.textContent = pretty({ ok: false, error: "Popup closed before verification completed" });
      }
    }, 400);

    function cleanup() {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
    }

    async function onMessage(event) {
      if (event.origin !== expectedOrigin) return;
      const payload = event.data || {};
      if (payload.type === ERROR_MSG) {
        cleanup();
        out.textContent = pretty({ ok: false, error: payload.error || "Verification denied" });
        return;
      }
      if (payload.type !== SUCCESS_MSG || !payload.code || payload.state !== start.state) return;
      if (completingVerification) return;
      completingVerification = true;
      cleanup();
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      try {
        out.textContent = "POST /api/verify/complete ...";
        const done = await api("/api/verify/complete", {
          method: "POST",
          body: JSON.stringify({ code: payload.code, state: payload.state }),
        });
        out.textContent = pretty(done);
        window.location.href = "/home";
      } catch (err) {
        completingVerification = false;
        out.textContent = pretty({ ok: false, error: err.message });
      }
    }

    window.addEventListener("message", onMessage);
  }

  document.getElementById("verifyPopup").addEventListener("click", () => {
    start("popup").catch((err) => {
      out.textContent = pretty({ ok: false, error: err.message });
    });
  });

  document.getElementById("verifyRedirect").addEventListener("click", () => {
    start("redirect").catch((err) => {
      out.textContent = pretty({ ok: false, error: err.message });
    });
  });

  document.getElementById("backLogin").addEventListener("click", () => {
    window.location.href = "/";
  });
}

function renderCallbackPage() {
  app.innerHTML = `
    <div class="card">
      <h1>Completing verification</h1>
      <p>Finishing OAuth code exchange via Node server...</p>
      <pre id="out">Waiting...</pre>
    </div>
  `;
  const out = document.getElementById("out");
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (code && state) {
    if (completingVerification) return;
    completingVerification = true;
    void api("/api/verify/complete", {
      method: "POST",
      body: JSON.stringify({ code, state }),
    })
      .then((done) => {
        out.textContent = pretty(done);
        window.location.href = "/home";
      })
      .catch((err) => {
        completingVerification = false;
        out.textContent = pretty({ ok: false, error: err.message });
      });
    return;
  }

  window.addEventListener("message", async (event) => {
    const payload = event.data || {};
    if (payload.type === ERROR_MSG) {
      out.textContent = pretty({ ok: false, error: payload.error || "Verification denied" });
      return;
    }
    if (payload.type !== SUCCESS_MSG || !payload.code || !payload.state) return;
    if (completingVerification) return;
    completingVerification = true;
    try {
      const done = await api("/api/verify/complete", {
        method: "POST",
        body: JSON.stringify({ code: payload.code, state: payload.state }),
      });
      out.textContent = pretty(done);
      window.location.href = "/home";
    } catch (err) {
      completingVerification = false;
      out.textContent = pretty({ ok: false, error: err.message });
    }
  });
}

function renderHomePage() {
  app.innerHTML = `
    <div class="card">
      <h1>Step 3: Home</h1>
      <p>Session from Node server (<code>GET /api/session</code>).</p>
      <div class="actions">
        <button id="refresh">Refresh</button>
        <button id="logout" class="secondary">Logout</button>
      </div>
    </div>
    <div class="card">
      <h2>Session</h2>
      <pre id="session">Loading...</pre>
    </div>
  `;

  const sessionEl = document.getElementById("session");

  async function loadSession() {
    const session = await api("/api/session");
    if (!session.verified) {
      window.location.href = "/verify";
      return;
    }
    sessionEl.textContent = pretty(session);
  }

  document.getElementById("refresh").addEventListener("click", () => {
    loadSession().catch((err) => {
      sessionEl.textContent = pretty({ ok: false, error: err.message });
    });
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST", body: "{}" });
    window.location.href = "/";
  });

  loadSession().catch(() => {
    window.location.href = "/";
  });
}

route();
