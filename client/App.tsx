import React, { useEffect, useMemo, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
  agents: string[];
  timestamp: string;
};

type SystemResponse = {
  databaseConfigured: boolean;
  dashboardProviders: {
    agentA: string;
    agentB: string;
    agentC: string;
  };
};

type PipelineResponse = {
  final_output: string;
  pipeline: {
    research: {
      topic?: string;
      key_points?: Array<{ id: string; insight: string; confidence: string }>;
      keywords?: string[];
      sources?: Array<{ type: string; reference: string }>;
    };
    plan: {
      task?: string;
      instructions?: string[];
      constraints?: string[];
      format?: string;
    };
    execution: {
      summary?: string[];
      output?: string;
      format?: string;
    };
  };
  provider_mapping?: {
    agentA: string;
    agentB: string;
    agentC: string;
  };
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  providers: {
    openai: { connected: boolean; updatedAt: string | null };
    gemini: { connected: boolean; updatedAt: string | null };
    claude: { connected: boolean; updatedAt: string | null };
  };
};

type HistoryItem = {
  id: string;
  input: string;
  finalOutput: string;
  summary: string[];
  status: "success" | "failed";
  errorMessage: string | null;
  providerMapping: {
    agentA: string;
    agentB: string;
    agentC: string;
  };
  createdAt: string;
};

const starterPrompts = [
  "Create a market positioning brief for a new AI workflow.",
  "Outline a launch strategy for a smart assistant product.",
  "Summarize the latest trends in collaborative agent systems.",
];

const dashboardPrompts = [
  "Craft a product launch memo for a connected AI workspace.",
  "Build a concise plan for a team-ready agent orchestration demo.",
  "Generate a polished strategy brief for an AI collaboration platform.",
];

const authInitialState = {
  name: "",
  email: "",
  password: "",
};

const providerInitialState = {
  openai: "",
  gemini: "",
  claude: "",
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload as T;
}

export function App() {
  const [input, setInput] = useState(starterPrompts[0]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [system, setSystem] = useState<SystemResponse | null>(null);
  const [demoResult, setDemoResult] = useState<PipelineResponse | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authForm, setAuthForm] = useState(authInitialState);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [providerForm, setProviderForm] = useState(providerInitialState);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerMessage, setProviderMessage] = useState("");
  const [workspaceInput, setWorkspaceInput] = useState(dashboardPrompts[0]);
  const [workspaceResult, setWorkspaceResult] = useState<PipelineResponse | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      requestJson<HealthResponse>("/api/health").catch(() => null),
      requestJson<SystemResponse>("/api/system").catch(() => null),
    ]).then(([healthPayload, systemPayload]) => {
      if (!active) {
        return;
      }

      setHealth(healthPayload);
      setSystem(systemPayload);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    requestJson<{ user: UserProfile }>("/api/auth/me", { method: "GET" })
      .then((payload) => {
        setUser(payload.user);
      })
      .catch(() => {
        setUser(null);
        setHistory([]);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    requestJson<{ history: HistoryItem[] }>("/api/dashboard/history", { method: "GET" })
      .then((payload) => {
        setHistory(payload.history);
      })
      .catch(() => {
        setHistory([]);
      });
  }, [user]);

  const dashboardReady = useMemo(() => Boolean(user), [user]);

  async function runDemoPipeline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDemoLoading(true);
    setDemoError("");

    try {
      const payload = await requestJson<PipelineResponse>("/api/pipeline/run", {
        method: "POST",
        body: JSON.stringify({ input }),
      });

      setDemoResult(payload);
    } catch (caughtError) {
      setDemoError(caughtError instanceof Error ? caughtError.message : "Demo request failed.");
    } finally {
      setDemoLoading(false);
    }
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = await requestJson<{ user: UserProfile }>(endpoint, {
        method: "POST",
        body: JSON.stringify(authForm),
      });

      setUser(payload.user);
      setAuthForm(authInitialState);
    } catch (caughtError) {
      setAuthError(caughtError instanceof Error ? caughtError.message : "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveProviderKeys(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProviderLoading(true);
    setProviderMessage("");

    try {
      const payload = await requestJson<{ user: UserProfile }>(
        "/api/dashboard/keys",
        {
          method: "POST",
          body: JSON.stringify({ providerKeys: providerForm }),
        },
      );

      setUser(payload.user);
      setProviderForm(providerInitialState);
      setProviderMessage("Provider keys saved securely.");
    } catch (caughtError) {
      setProviderMessage(caughtError instanceof Error ? caughtError.message : "Unable to save keys.");
    } finally {
      setProviderLoading(false);
    }
  }

  async function runWorkspacePipeline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceLoading(true);
    setWorkspaceError("");

    try {
      const payload = await requestJson<PipelineResponse>(
        "/api/dashboard/pipeline/run",
        {
          method: "POST",
          body: JSON.stringify({ input: workspaceInput }),
        },
      );

      setWorkspaceResult(payload);
      const historyPayload = await requestJson<{ history: HistoryItem[] }>("/api/dashboard/history", {
        method: "GET",
      });
      setHistory(historyPayload.history);
    } catch (caughtError) {
      setWorkspaceError(
        caughtError instanceof Error ? caughtError.message : "Workspace pipeline failed.",
      );
    } finally {
      setWorkspaceLoading(false);
    }
  }

  function logout() {
    requestJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" })
      .catch(() => ({ ok: false }))
      .finally(() => {
        setUser(null);
        setHistory([]);
        setWorkspaceResult(null);
        setProviderMessage("");
      });
  }

  return (
    <div className="shell">
      <div className="aurora aurora-left" />
      <div className="aurora aurora-right" />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PipAI Public Landing</p>
          <h1>Showcase a polished multi-agent experience while keeping the workspace focused and clean.</h1>
          <p className="hero-text">
            Public visitors can explore a sample AI workflow, and registered users unlock a private
            dashboard for a secure workspace with connected provider integrations.
          </p>
          <div className="hero-actions">
            <a className="hero-link" href="#get-started">
              Start now
            </a>
            <a className="hero-link hero-link-muted" href="#demo">
              View demo
            </a>
          </div>
        </div>

        <div className="hero-panel">
          <div className="status-row">
            <span className={`status-dot ${health ? "online" : "offline"}`} />
            <span>{health ? `${health.service} public app ready` : "API status unavailable"}</span>
          </div>
          <div className="metric-grid">
            <div className="metric-card">
              <span className="metric-label">Landing Mode</span>
              <strong>Demo</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Dashboard</span>
              <strong>{system?.databaseConfigured ? "Accounts" : "Needs DB"}</strong>
            </div>
          </div>
          <div className="provider-stack">
            <span>Preview agent orchestration in public mode</span>
            <span>Unlock private provider workflows after login</span>
            <span>Keep the interface clean and easy to explore</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section id="demo" className="composer">
          <div className="section-heading">
            <h2>Public Demo</h2>
            <p>Try a guided sample workflow that shows how the public preview works.</p>
          </div>

          <div className="prompt-pills">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-pill"
                type="button"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={runDemoPipeline} className="composer-form">
            <textarea
              id="pipeline-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the public demo pipeline to research, plan, and execute a task."
              rows={6}
            />
            <div className="composer-actions">
              <button className="run-button" type="submit" disabled={demoLoading}>
                {demoLoading ? "Running demo..." : "Run Public Demo"}
              </button>
              <span className="helper-copy">Uses example Agent A, B, and C</span>
            </div>
          </form>

          {demoError ? <p className="error-banner">{demoError}</p> : null}
        </section>

        <section className="results-grid">
          <article className="panel panel-output">
            <div className="section-heading">
              <h2>Demo Output</h2>
              <p>Results from the public sample workflow are shown here instantly.</p>
            </div>
            <pre>{demoResult?.final_output || "Run the public demo to see the output here."}</pre>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent A</h2>
              <p>Research and insight generation for the sample demo.</p>
            </div>
            <div className="chip-row">
              {(demoResult?.pipeline.research.keywords || []).map((keyword) => (
                <span key={keyword} className="chip">
                  {keyword}
                </span>
              ))}
            </div>
            <ul className="detail-list">
              {(demoResult?.pipeline.research.key_points || []).map((point) => (
                <li key={point.id}>
                  <strong>{point.confidence}</strong> {point.insight}
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent B</h2>
              <p>Strategic planning for the workflow in the demo.</p>
            </div>
            <ul className="detail-list">
              {(demoResult?.pipeline.plan.instructions || []).map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent C</h2>
              <p>Execution and final delivery for the sample workflow.</p>
            </div>
            <ul className="detail-list">
              {(demoResult?.pipeline.execution.summary || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section id="get-started" className="auth-layout">
          <article className="panel auth-panel">
            <div className="section-heading">
              <h2>Get Started</h2>
              <p>Create an account or sign in to open the private PipAI dashboard.</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
              <button
                type="button"
                className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
            </div>

            <form onSubmit={submitAuth} className="stack-form">
              {authMode === "register" ? (
                <input
                  className="field"
                  type="text"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              ) : null}
              <input
                className="field"
                type="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <input
                className="field"
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, password: event.target.value }))
                }
              />

              <button className="run-button" type="submit" disabled={authLoading || !system?.databaseConfigured}>
                {authLoading ? "Working..." : authMode === "register" ? "Create Account" : "Login"}
              </button>
            </form>

            {authError ? <p className="error-banner">{authError}</p> : null}
            {!system?.databaseConfigured ? (
              <p className="notice-banner">
                Private account features will be available once the server is configured.
              </p>
            ) : null}
          </article>

          <article className="panel auth-panel">
            <div className="section-heading">
              <h2>Dashboard Workflow</h2>
              <p>Private users bring their own model keys and run the real provider pipeline.</p>
            </div>

            <ul className="detail-list">
              <li>Connect your provider accounts to move from preview to private workspace.</li>
              <li>Securely store and reuse keys for authenticated runs.</li>
              <li>Track your latest workspace activity from the dashboard.</li>
            </ul>
          </article>
        </section>

        <section className="dashboard-shell">
          <div className="section-heading">
            <h2>Private Dashboard</h2>
            <p>
              {dashboardReady
                ? `Welcome back, ${user?.name}.`
                : "Login or register first to access the private workspace."}
            </p>
          </div>

          {dashboardReady ? (
            <div className="dashboard-grid">
              <article className="panel">
                <div className="section-heading">
                  <h2>Saved Providers</h2>
                  <p>Each provider powers one agent in the private workflow.</p>
                </div>
                <div className="provider-cards">
                  <div className="provider-card">
                    <strong>Agent A</strong>
                    <span>OpenAI</span>
                    <em>{user?.providers.openai.connected ? "Connected" : "Missing key"}</em>
                  </div>
                  <div className="provider-card">
                    <strong>Agent B</strong>
                    <span>Gemini</span>
                    <em>{user?.providers.gemini.connected ? "Connected" : "Missing key"}</em>
                  </div>
                  <div className="provider-card">
                    <strong>Agent C</strong>
                    <span>Claude Sonnet</span>
                    <em>{user?.providers.claude.connected ? "Connected" : "Missing key"}</em>
                  </div>
                </div>
                <button className="secondary-button" type="button" onClick={logout}>
                  Logout
                </button>
              </article>

              <article className="panel">
                <div className="section-heading">
                  <h2>Provider Keys</h2>
                  <p>Paste your provider keys and keep them encrypted for your private workspace.</p>
                </div>
                <form onSubmit={saveProviderKeys} className="stack-form">
                  <input
                    className="field"
                    type="password"
                    placeholder="OpenAI API key"
                    value={providerForm.openai}
                    onChange={(event) =>
                      setProviderForm((current) => ({ ...current, openai: event.target.value }))
                    }
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="Gemini API key"
                    value={providerForm.gemini}
                    onChange={(event) =>
                      setProviderForm((current) => ({ ...current, gemini: event.target.value }))
                    }
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="Claude API key"
                    value={providerForm.claude}
                    onChange={(event) =>
                      setProviderForm((current) => ({ ...current, claude: event.target.value }))
                    }
                  />
                  <button className="run-button" type="submit" disabled={providerLoading}>
                    {providerLoading ? "Saving..." : "Save Provider Keys"}
                  </button>
                </form>
                {providerMessage ? <p className="notice-banner">{providerMessage}</p> : null}
              </article>

              <article className="panel dashboard-runner">
                <div className="section-heading">
                  <h2>Run Private Workspace</h2>
                  <p>Execute the private multi-agent workflow with your connected providers.</p>
                </div>
                <div className="prompt-pills">
                  {dashboardPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="prompt-pill"
                      type="button"
                      onClick={() => setWorkspaceInput(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <form onSubmit={runWorkspacePipeline} className="composer-form">
                  <textarea
                    value={workspaceInput}
                    onChange={(event) => setWorkspaceInput(event.target.value)}
                    rows={5}
                    placeholder="Run the private multi-provider pipeline with your saved keys."
                  />
                  <div className="composer-actions">
                    <button className="run-button" type="submit" disabled={workspaceLoading}>
                      {workspaceLoading ? "Running providers..." : "Run Private Workspace"}
                    </button>
                    <span className="helper-copy">Run your private workspace securely.</span>
                  </div>
                </form>
                {workspaceError ? <p className="error-banner">{workspaceError}</p> : null}
              </article>

              <article className="panel panel-output dashboard-output">
                <div className="section-heading">
                  <h2>Private Output</h2>
                  <p>The authenticated pipeline uses real provider APIs with your stored keys.</p>
                </div>
                <pre>
                  {workspaceResult?.final_output ||
                    "Run the private workspace to see the provider-backed result here."}
                </pre>
              </article>

              <article className="panel dashboard-output">
                <div className="section-heading">
                  <h2>Run History</h2>
                  <p>Your latest dashboard runs appear here after each run.</p>
                </div>
                {history.length ? (
                  <div className="history-list">
                    {history.map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-meta">
                          <strong>{item.status === "success" ? "Success" : "Failed"}</strong>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="history-input">{item.input}</p>
                        <p className="history-providers">
                          {item.providerMapping.agentA} / {item.providerMapping.agentB} / {item.providerMapping.agentC}
                        </p>
                        <pre>{item.finalOutput || item.errorMessage || "No output recorded."}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="notice-banner">No runs recorded yet. Your next private run will appear here.</p>
                )}
              </article>
            </div>
          ) : (
            <article className="panel empty-state">
              <h3>Private workspace locked</h3>
              <p>
                Create an account, connect OpenAI, Gemini, and Claude, then your dashboard will be
                ready for the real three-provider pipeline.
              </p>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
