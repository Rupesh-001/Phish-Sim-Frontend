// frontend/src/pages/Generator.jsx
import { useState, useRef, useEffect } from "react";
import "./generator.css";
import { apiFetch } from "../apiClient";

/*
  Holo accent image used by the CSS:
  /mnt/data/7702a7cf-d0f3-48fa-ba9d-cd77fb069cee.png
  (If you want a different uploaded image, give me its path and I'll update the CSS.)
*/

const HOLO_IMAGE = "/mnt/data/7702a7cf-d0f3-48fa-ba9d-cd77fb069cee.png";

export default function Generator({ token }) {
  const [difficulty, setDifficulty] = useState("beginner");
  const [count, setCount] = useState(5);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const logsRef = useRef(null);

  // helper to prepend timestamped log lines (keeps newest at top)
  function log(msg) {
    const ts = new Date().toLocaleTimeString();
    setLogs((l) => [`[${ts}] ${msg}`, ...l].slice(0, 200));
  }

  useEffect(() => {
    // optional: auto-scroll logs to top (newest at top), keep focusable
    if (logsRef.current) {
      // no scroll needed since newest entries are at top; ensuring visible focus
      logsRef.current.scrollTop = 0;
    }
  }, [logs]);

  async function generateSingle() {
    try {
      const body = { difficulty };
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // apiFetch throws on non-OK; we catch below and return structured info
      const data = await apiFetch("/api/challenges/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      return { ok: true, status: 200, body: data };
    } catch (err) {
      // err.message may contain server message or generic message
      const msg = err.message || "Request failed";
      // return structure similar to original function so run() can handle it
      return { ok: false, status: err.status || 500, body: { error: msg } };
    }
  }

  async function run() {
    setRunning(true);
    setLogs([]);
    setSuccessCount(0);

    let localSuccess = 0;

    for (let i = 1; i <= count; i++) {
      log(`▶ Starting ${i}/${count}...`);
      try {
        const { ok, status, body } = await generateSingle();
        if (ok) {
          localSuccess++;
          setSuccessCount(localSuccess); // update UI progressively
          log(
            `✔ ${i}: generated id=${body.id || "?"} title="${(body.challenge?.title) || ""}"`
          );
        } else {
          log(`✖ ${i}: status=${status} error=${body.error || JSON.stringify(body)}`);
        }
      } catch (err) {
        log(`✖ ${i}: fetch failed: ${err.message}`);
      }

      // gentle delay
      await new Promise((r) => setTimeout(r, 200));
    }

    setRunning(false);
    // final summary (use localSuccess to avoid stale state)
    log(`✔ Done. ${localSuccess}/${count} succeeded.`);
    setSuccessCount(localSuccess);
  }

  return (
    <div className="gen-root" aria-live="polite">
      <div className="gen-panel" style={{ /* keep reference to holo; CSS already applies it */ }}>
        <div className="gen-header">
          <h2 className="gen-title">Challenge Generator</h2>
          <div className="gen-subtext">Create phishing challenges using AI</div>
        </div>

        {/* Difficulty */}
        <div className="gen-field" style={{ marginTop: 18 }}>
          <label htmlFor="difficulty" className="gen-label">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="gen-select"
            aria-label="Select difficulty"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Count */}
        <div className="gen-field" style={{ marginTop: 14 }}>
          <label htmlFor="count" className="gen-label">Count</label>
          <input
            id="count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="gen-input"
            aria-label="Number of challenges to generate"
          />
        </div>

        {/* Button */}
        <button
          aria-disabled={running}
          disabled={running}
          onClick={run}
          className={`gen-btn ${running ? "disabled" : ""}`}
          style={{ marginTop: 18 }}
        >
          {running ? "Generating..." : `Generate ${count}`}
        </button>

        {/* Success stats */}
        <div className="gen-success" aria-live="polite" style={{ marginTop: 12 }}>
          <strong>Success:</strong> {successCount} / {count}
        </div>

        {/* Logs */}
        <div
          className="gen-logs"
          ref={logsRef}
          role="log"
          aria-atomic="false"
          aria-relevant="additions"
        >
          {logs.length === 0 ? (
            <div className="gen-empty">No logs yet.</div>
          ) : (
            <ul>
              {logs.map((l, i) => (
                <li key={i} style={{ whiteSpace: "pre-wrap" }}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
