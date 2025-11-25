import { useState } from "react";
import "./login.css";
import { apiFetch } from "../apiClient"; // ✅ added

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("Logging in...");
    setLoading(true);

    try {
      // ⬇️ Replaced fetch("/api/auth/login") with apiFetch
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (data.token) {
        onLogin?.(data.token);
      } else {
        setMsg(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="login-card" noValidate>
      <div className="login-holo" aria-hidden="true" />
      <h3 className="login-title">Login</h3>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="login-input"
        required
        autoComplete="email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="login-input"
        required
        autoComplete="current-password"
      />

      <button className="login-btn" type="submit" disabled={loading}>
        {loading ? "Logging..." : "Login"}
      </button>

      <div
        className={`login-msg ${
          msg && msg.toLowerCase().includes("error") ? "error" : ""
        }`}
      >
        {msg}
      </div>

      <div className="switch-text">
        <span style={{ color: "rgba(200,255,220,0.45)" }}>
          Don't have an account?
        </span>
        <span
          className="switch-link"
          role="button"
          tabIndex={0}
          onClick={() => onSwitch?.("register")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSwitch?.("register");
          }}
        >
          Create account
        </span>
      </div>
    </form>
  );
}
