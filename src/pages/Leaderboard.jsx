import { useEffect, useState } from "react";
import "./leaderboard.css";
import { apiFetch } from "../apiClient"; // <- centralized client

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [board, setBoard] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // apiFetch will throw on non-OK responses, so wrap in try/catch
      const data = await apiFetch("/api/leaderboard");
      setBoard(data.leaderboard || []);
    } catch (e) {
      // show friendly message
      setError(e.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="lb-root">
        <div className="lb-panel lb-loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lb-root">
        <div className="lb-panel lb-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="lb-root">
      <div className="lb-header">
        <h2>Leaderboard</h2>
        <button className="lb-refresh" onClick={load} aria-label="Refresh leaderboard">⟳</button>
      </div>

      <div className="lb-panel">
        <div className="lb-columns">
          <div className="lb-left">

            {/* Top performer */}
            {board.slice(0, 1).map((u) => (
              <div key={u.id || u._id} className="lb-top-card">
                <div className="lb-top-meta">
                  <div className="lb-medal rank-1">1</div>
                  <div>
                    <div className="lb-name">{u.name}</div>
                    <div className="lb-sub">Top performer</div>
                  </div>
                </div>
                <div className="lb-points">{u.points}</div>
              </div>
            ))}

            {/* Other ranks */}
            <div className="lb-list">
              {board.slice(1).map((u) => (
                <div
                  key={u.id || u._id}
                  className={`lb-row ${u.isCurrent ? "current" : ""}`}
                  tabIndex={0}
                >
                  <div className="lb-rank">
                    {u.rank <= 3 ? (
                      <span className={`lb-medal small rank-${u.rank}`}>{u.rank}</span>
                    ) : (
                      <span className="lb-rank-num">{u.rank}</span>
                    )}
                  </div>

                  <div className="lb-info">
                    <div className="lb-name">{u.name}</div>
                    <div className="lb-sub">{u.badgesCount ?? 0} badges</div>
                  </div>

                  <div className="lb-points-small">{u.points}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE — Top 3 + Refresh ONLY */}
          <aside className="lb-right">
            <div className="lb-box">
              <div className="lb-box-title">Top 3</div>
              <ol className="lb-top3">
                {board.slice(0, 3).map((u, i) => (
                  <li key={u.id || u._id}>
                    <span className={`lb-medal tiny rank-${i + 1}`}>{i + 1}</span>
                    <span className="lb-name-sm">{u.name}</span>
                    <span className="lb-pts-sm">{u.points}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lb-box">
              <div className="lb-box-title">Refresh</div>
              <button className="lb-btn" onClick={load}>Refresh Now</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
