import React, { useEffect, useState } from "react";
import "./profile.css";
import { apiFetch } from "../apiClient"; // <- centralized client
import { API_BASE } from "../config"; // <- used to build absolute cert URLs

export default function Profile({ token }) {
  const [profile, setProfile] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load profile
        const data = await apiFetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(data);

        // Load certificates
        try {
          const cd = await apiFetch("/api/certificates/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCerts(cd.certificates || []);
        } catch (e) {
          // If certificate endpoint fails, don't block profile
          console.warn("Failed to load certificates:", e);
          setCerts([]);
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  async function generateCert() {
    setGenerating(true);
    try {
      const data = await apiFetch("/api/certificates/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // data.url is typically a relative path like /certificates/...
      if (data.url) {
        // Build absolute URL using API_BASE so it works in dev & prod
        const certUrl = data.url.startsWith("http")
          ? data.url
          : `${API_BASE}${data.url}`;
        window.open(certUrl, "_blank");
      }

      // refresh certificates list
      try {
        const cd = await apiFetch("/api/certificates/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCerts(cd.certificates || []);
      } catch (e) {
        console.warn("Failed to refresh certificates:", e);
      }
    } catch (e) {
      console.error("Generate certificate error:", e);
      alert(e.message || "Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="pg-root">
        <div className="pg-card pg-loading">
          <div className="pg-dot" />
          <div className="pg-loading-text">INITIALIZING PROFILE — SECURE CHANNEL</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="pg-root">
        <div className="pg-card pg-err">
          <div className="pg-dot err" />
          <div className="pg-loading-text">ERROR: {err}</div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const points = profile.points || 0;
  const level =
    profile.level ||
    (points >= 600 ? "Advanced" : points >= 200 ? "Intermediate" : "Beginner");
  const nextThreshold = level === "Beginner" ? 200 : level === "Intermediate" ? 600 : 1000;
  const pct = Math.min(100, Math.round((points / nextThreshold) * 100));

  // circular progress math (same as before)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="pg-root">
      <div className="pg-container">
        <div className="pg-wrapper">
          <div className="pg-holo" />

          {/* Header (user info only, no topbar here) */}
          <div className="pg-header">
            <div>
              <div className="pg-title-row">
                <div className="pg-dot glow" />
                <h1 className="pg-name">{profile.name?.toUpperCase()}</h1>
              </div>
              <p className="pg-email strong">{profile.email}</p>
            </div>
            {/* Sign out removed - global header handles signout */}
          </div>

          {/* Stats grid */}
          <div className="pg-grid">
            <div className="pg-card pg-stat">
              <div className="pg-small">Total Points</div>
              <div className="pg-big">{points}</div>
            </div>

            <div className="pg-card pg-stat">
              <div className="pg-small">Current Level</div>
              <div className="pg-big">{level.toUpperCase()}</div>
            </div>

            <div className="pg-card pg-stat">
              <div className="pg-small">Next Milestone</div>
              <div className="pg-big">{nextThreshold}</div>
            </div>
          </div>

          {/* Circular progress area */}
          <div className="pg-progress-wrap">
            <div className="pg-progress-top">
              <span className="pg-progress-label">PROGRESS TO NEXT LEVEL</span>
              <span className="pg-progress-pct">{pct}%</span>
            </div>

            <div className="pg-circular-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120" className="pg-circle">
                <defs>
                  <linearGradient id="g2" x1="0" x2="1">
                    <stop offset="0%" stopColor="var(--neon)" />
                    <stop offset="100%" stopColor="var(--neon-2)" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r={radius} className="pg-circle-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="pg-circle-fg"
                  stroke="url(#g2)"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
                <text x="60" y="66" textAnchor="middle" className="pg-circle-text">
                  {pct}%
                </text>
                <text x="60" y="84" textAnchor="middle" className="pg-circle-sub">
                  {points} / {nextThreshold}
                </text>
              </svg>

              <div className="pg-progress-info">
                <div className="pg-progress-foot">
                  Points: <strong>{points}</strong>
                </div>
                <div className="pg-progress-foot">
                  Need: <strong>{nextThreshold - points}</strong> more
                </div>
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div className="pg-columns">
            <div className="pg-left">
              {/* Badges */}
              <section className="pg-section">
                <div className="pg-section-title">
                  <div className="pg-accent" />
                  <h2>BADGES</h2>
                </div>

                <div className="pg-box">
                  {profile.badges?.length === 0 ? (
                    <div className="pg-muted">[ NO BADGES EARNED ]</div>
                  ) : (
                    <div className="pg-badges">
                      {profile.badges.map((b) => (
                        <span key={b} className="pg-badge">
                          {b.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Certificates */}
              <section className="pg-section">
                <div className="pg-section-title">
                  <div className="pg-accent" />
                  <h2>CERTIFICATES</h2>
                </div>

                <div className="pg-box">
                  {certs.length === 0 ? (
                    <div className="pg-muted">[ NO CERTIFICATES ISSUED ]</div>
                  ) : (
                    <div className="pg-certs">
                      {certs.map((c) => (
                        <div key={c.id || c._id} className="pg-cert">
                          <div>
                            <div className="pg-cert-level">{c.level?.toUpperCase()}</div>
                            <div className="pg-cert-date">
                              ISSUED: {new Date(c.issuedAt || c.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {c.url && (
                            // make sure url is absolute so it opens correctly
                            <a
                              href={c.url.startsWith("http") ? c.url : `${API_BASE}${c.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="pg-open"
                            >
                              OPEN
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={generateCert}
                    disabled={generating || level === "Beginner"}
                    className={"pg-btn pg-btn-generate " + (level === "Beginner" ? "disabled" : "")}
                  >
                    {generating
                      ? "GENERATING..."
                      : level === "Beginner"
                      ? "REACH INTERMEDIATE LEVEL"
                      : "GENERATE CERTIFICATE"}
                  </button>
                </div>
              </section>
            </div>

            <div className="pg-right">
              <div className="pg-section-title">
                <div className="pg-accent" />
                <h2>RECENT ACTIVITY</h2>
              </div>

              <div className="pg-box pg-activity">
                {profile.attempts?.length === 0 ? (
                  <div className="pg-muted">[ NO ACTIVITY LOGGED ]</div>
                ) : (
                  profile.attempts.map((at) => (
                    <div key={at._id} className={"pg-activity-item " + (at.correct ? "ok" : "bad")}>
                      <div className="pg-activity-head">
                        <span className="pg-activity-status">{at.correct ? "[SUCCESS]" : "[FAILED]"}</span>
                      </div>
                      <div className="pg-activity-meta">CHALLENGE: {String(at.challengeId).substring(0,12)}...</div>
                      <div className="pg-activity-time">{new Date(at.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pg-foot">SECURE CONNECTION • TLS 1.3 • AUTHENTICATED</div>
      </div>
    </div>
  );
}
