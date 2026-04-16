import React, { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
  agents: string[];
  timestamp: string;
};

type PipelineResponse = {
  final_output: string;
  pipeline: {
    research: {
      topic: string;
      key_points: Array<{ id: string; insight: string; confidence: string }>;
      keywords: string[];
      sources: Array<{ type: string; reference: string }>;
    };
    plan: {
      task: string;
      instructions: string[];
      constraints: string[];
      format: string;
    };
    execution: {
      summary: string[];
      output: string;
      format: string;
    };
  };
};

const starterPrompts = [
  "Create an onboarding guide for new PipAI contributors.",
  "Plan a launch checklist for an AI club campus event.",
  "Draft a concise research brief about multi-agent orchestration.",
];

export function App() {
  const [input, setInput] = useState(starterPrompts[0]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load API health.");
        }

        return (await response.json()) as HealthResponse;
      })
      .then((payload) => {
        if (active) {
          setHealth(payload);
        }
      })
      .catch(() => {
        if (active) {
          setHealth(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function runPipeline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Pipeline execution failed.");
      }

      setResult(payload as PipelineResponse);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unexpected pipeline error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="aurora aurora-left" />
      <div className="aurora aurora-right" />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Multi-Agent AI Workspace</p>
          <h1>PipAI turns one prompt into a research, planning, and execution pipeline.</h1>
          <p className="hero-text">
            A lightweight React interface on top of the Express API, built to make the
            three-agent flow visible instead of hiding it behind one response box.
          </p>
        </div>

        <div className="hero-panel">
          <div className="status-row">
            <span className={`status-dot ${health ? "online" : "offline"}`} />
            <span>{health ? `${health.service} API ready` : "API status unavailable"}</span>
          </div>
          <div className="metric-grid">
            <div className="metric-card">
              <span className="metric-label">Agents</span>
              <strong>{health?.agents.length || 3}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Output</span>
              <strong>Markdown</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="composer">
          <div className="section-heading">
            <h2>Prompt Composer</h2>
            <p>Describe the task once and let each agent contribute its stage of the flow.</p>
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

          <form onSubmit={runPipeline} className="composer-form">
            <label className="sr-only" htmlFor="pipeline-input">
              Pipeline input
            </label>
            <textarea
              id="pipeline-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask PipAI to research, plan, and execute a task."
              rows={6}
            />

            <div className="composer-actions">
              <button className="run-button" type="submit" disabled={loading}>
                {loading ? "Running pipeline..." : "Run PipAI"}
              </button>
              <span className="helper-copy">POST /api/pipeline/run</span>
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}
        </section>

        <section className="results-grid">
          <article className="panel panel-output">
            <div className="section-heading">
              <h2>Final Output</h2>
              <p>The executor turns the plan into the final markdown response.</p>
            </div>
            <pre>{result?.final_output || "Run the pipeline to see the final output here."}</pre>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent A</h2>
              <p>Research and context building.</p>
            </div>
            <div className="chip-row">
              {(result?.pipeline.research.keywords || []).map((keyword) => (
                <span key={keyword} className="chip">
                  {keyword}
                </span>
              ))}
            </div>
            <ul className="detail-list">
              {(result?.pipeline.research.key_points || []).map((point) => (
                <li key={point.id}>
                  <strong>{point.confidence}</strong> {point.insight}
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent B</h2>
              <p>Task planning and constraints.</p>
            </div>
            <ul className="detail-list">
              {(result?.pipeline.plan.instructions || []).map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Agent C</h2>
              <p>Execution summary and final formatting.</p>
            </div>
            <ul className="detail-list">
              {(result?.pipeline.execution.summary || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
