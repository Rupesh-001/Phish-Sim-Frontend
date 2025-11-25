import { useEffect, useState } from "react";
import "./challengeRunner.css";
import { apiFetch } from "../apiClient"; // <- use centralized client

export default function ChallengeRunner({ challenge, token, onNext }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);

  // local fallback image (uploaded file)
  const defaultLogo = "/mnt/data/932aec8a-4819-4a20-93ca-79293e4d28d9.png";

  useEffect(() => {
    setSelected(null);
    setResult(null);
    setLoadingSubmit(false);
    setInfoMessage(null);
  }, [challenge?._id]);

  async function submitAttempt() {
    if (!selected) return setInfoMessage("Please select an option.");

    setLoadingSubmit(true);
    setInfoMessage(null);
    try {
      const data = await apiFetch("/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: challenge._id,
          chosenId: selected,
        }),
      });

      // apiFetch throws for non-OK responses, so if we reach here it's OK
      setResult(data);
      setInfoMessage(data.correct ? "✔ Correct!" : "✖ Incorrect");
    } catch (err) {
      // apiFetch throws an Error which may contain a message from server
      console.error("submitAttempt error:", err);
      // try to show a friendly message
      const msg = err && err.message ? err.message : "Network error.";
      setInfoMessage(msg);
      setResult(null);
    } finally {
      setLoadingSubmit(false);
    }
  }

  function handleNextClick() {
    if (typeof onNext === "function") onNext(challenge?._id);
  }

  // keyboard helper for option buttons
  function handleOptionKey(e, id) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(id);
    }
  }

  if (!challenge) {
    return (
      <div className="cr-root" aria-live="polite">
        <div className="panel">Loading…</div>
      </div>
    );
  }

  return (
    <div className="cr-root" aria-live="polite">
      {/* Header Section */}
      <div className="cr-header">
        <div className="cr-logo" aria-hidden={!!challenge.imageUrl}>
          <img
            src={challenge.imageUrl || defaultLogo}
            alt={challenge.imageUrl ? "challenge logo" : "default logo"}
            onError={(e) => {
              e.currentTarget.src = defaultLogo;
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h2 className="cr-title">{challenge.title}</h2>
          <div className="cr-sender" aria-hidden="false">
            {challenge.sender || "Unknown sender"}
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="cr-email" role="article" aria-label="Email content">
        {challenge.htmlBody ? (
          <div
            dangerouslySetInnerHTML={{ __html: challenge.htmlBody }}
            style={{ maxWidth: "100%" }}
          />
        ) : (
          <pre>{challenge.body}</pre>
        )}

        {challenge.invoiceUrl && (
          <div style={{ marginTop: 12 }}>
            <a
              href={challenge.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="cr-link"
            >
              Open Invoice (PDF)
            </a>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="cr-options" role="listbox" aria-label="Answer options">
        {Array.isArray(challenge.options) && challenge.options.length > 0 ? (
          challenge.options.map((opt) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={0}
                onKeyDown={(e) => handleOptionKey(e, opt.id)}
                onClick={() => setSelected(opt.id)}
                className={`cr-option ${active ? "active" : ""}`}
              >
                <div className="opt-bullet" aria-hidden="true">
                  {String(opt.id)}
                </div>
                <div className="opt-text">{opt.text}</div>
              </button>
            );
          })
        ) : (
          <div className="cr-info">No options available for this challenge.</div>
        )}
      </div>

      {/* Info message */}
      {infoMessage && (
        <div className="cr-info" role="status">
          {infoMessage}
        </div>
      )}

      {/* Actions */}
      <div className="cr-actions" role="toolbar" aria-label="Actions">
        <button
          onClick={submitAttempt}
          disabled={loadingSubmit}
          className="cr-btn"
          aria-disabled={loadingSubmit}
        >
          {loadingSubmit ? "Submitting..." : "Submit"}
        </button>

        <button onClick={handleNextClick} className="cr-btn cr-btn--muted" type="button">
          Next
        </button>

        <button
          onClick={() =>
            setInfoMessage(infoMessage ? null : challenge.explanation || "No explanation")
          }
          className="cr-explain"
          type="button"
        >
          Explanation
        </button>
      </div>

      {/* Result Box */}
      {result && (
        <div className="cr-result" aria-live="polite">
          <div className={result.correct ? "correct" : "incorrect"}>
            {result.correct ? "✔ Correct" : "✖ Incorrect"}
          </div>

          <div style={{ marginTop: 8, color: "var(--neon)" }}>
            Points Earned: +{result.pointsEarned ?? 0}
          </div>

          <div style={{ marginTop: 8, color: "#d8fbe0" }}>
            <strong>Explanation:</strong>
            <div style={{ marginTop: 6 }}>{challenge.explanation || "—"}</div>
          </div>

          {Array.isArray(result.awardedBadges) && result.awardedBadges.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong style={{ color: "var(--neon)" }}>Badges Earned:</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {result.awardedBadges.map((b) => (
                  <span key={b} className="cr-badge">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
