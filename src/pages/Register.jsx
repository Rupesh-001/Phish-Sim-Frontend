import { useState } from "react";
import "./register.css";
import { apiFetch } from "../apiClient"; // added

export default function Register({ onRegister, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("Registering...");
    setLoading(true);

    try {
      // replaced fetch("/api/auth/register") with apiFetch
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (data.token) {
        onRegister?.(data.token);
      } else {
        setMsg(data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Register error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="register-card" noValidate>
      <div className="register-holo" aria-hidden="true" />
      <h3 className="register-title">Create Account</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="register-input"
        required
        autoComplete="name"
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="register-input"
        required
        autoComplete="email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="register-input"
        required
        autoComplete="new-password"
      />

      <button className="register-btn" type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>

      <div className={`register-msg ${msg && msg.toLowerCase().includes("error") ? "error" : ""}`}>
        {msg}
      </div>

      <div className="switch-text">
        <span style={{ color: "rgba(200,255,220,0.45)" }}>Already have an account?</span>
        <span
          className="switch-link"
          role="button"
          tabIndex={0}
          onClick={() => onSwitch?.("login")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSwitch?.("login");
          }}
        >
          Login
        </span>
      </div>
    </form>
  );
}
