// src/App.jsx
import { useEffect, useRef, useState } from "react";
import ChallengeRunner from "./components/ChallengeRunner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Generator from "./pages/Generator";

import "./App.css"; // global cyber theme
import "./pages/login.css";    // ensures .auth-wrapper + transition helpers are loaded
import "./pages/register.css"; // same here

import { apiFetch } from "./apiClient"; // ✅ use centralized API client

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [challenge, setChallenge] = useState(null);
  const [view, setView] = useState("home");

  // which auth card to show when not logged in: "login" or "register"
  const [authPage, setAuthPage] = useState("login");

  // transition control
  const [isSwitching, setIsSwitching] = useState(false);
  const [justSwitched, setJustSwitched] = useState(false);
  const switchTimeoutRef = useRef(null);

  async function loadRandom(excludeId = null) {
    try {
      let path = "/api/challenges/random";
      if (excludeId) path += `?exclude=${excludeId}`;

      // ✅ use apiFetch so it goes to VITE_API_URL in prod, localhost in dev
      const data = await apiFetch(path);
      if (!data.challenge) {
        setChallenge(null);
        return null;
      }
      setChallenge(data.challenge);
      return data.challenge;
    } catch (err) {
      console.error("Failed to load random challenge:", err);
      return null;
    }
  }

  useEffect(() => {
    if (token) loadRandom();
    // clean up on unmount
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    };
  }, [token]);

  function handleLoginSuccess(tkn) {
    localStorage.setItem("token", tkn);
    setToken(tkn);
    setView("home");
    loadRandom();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setChallenge(null);
    setView("home");
    setAuthPage("login");
  }

  // Smooth fade/slide switch between auth pages (login <-> register)
  function handleAuthSwitch(target) {
    if (target === authPage) return;
    // start "out" animation
    setIsSwitching(true);

    // after out animation finishes, swap page and show "in" animation
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      setAuthPage(target);
      setJustSwitched(true);

      // clear states after the "in" animation finishes
      switchTimeoutRef.current = setTimeout(() => {
        setIsSwitching(false);
        setJustSwitched(false);
      }, 320);
    }, 260); // match the CSS animation duration (260ms)
  }

  return (
    <div className="app-root">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-left">
            <div className="app-logo">Phishing Simulator</div>
          </div>

          <nav className="app-nav" role="navigation" aria-label="Main navigation">
            <button
              className={`nav-item ${view === "home" ? "active" : ""}`}
              onClick={() => {
                setView("home");
                loadRandom();
              }}
            >
              New
            </button>

            <button
              className={`nav-item ${view === "profile" ? "active" : ""}`}
              onClick={() => setView("profile")}
            >
              Profile
            </button>

            <button
              className={`nav-item ${view === "leaderboard" ? "active" : ""}`}
              onClick={() => setView("leaderboard")}
            >
              Leaderboard
            </button>

            <button
              className={`nav-item ${view === "generator" ? "active" : ""}`}
              onClick={() => setView("generator")}
            >
              Generator
            </button>
          </nav>

          <div className="app-right">
            {token && (
              <button className="nav-item signout" onClick={logout}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="app-container">
        {!token ? (
          /* Centered auth wrapper — both login.css & register.css include .auth-wrapper */
          <div className="auth-wrapper">
            <div className="auth-background-grid" aria-hidden="true" />

            {/* wrapper that gets animation classes applied */}
            <div
              className={`auth-card-wrap ${isSwitching ? "anim-out" : ""} ${
                justSwitched ? "anim-in" : ""
              }`}
            >
              {authPage === "login" ? (
                <Login onLogin={handleLoginSuccess} onSwitch={handleAuthSwitch} />
              ) : (
                <Register onRegister={handleLoginSuccess} onSwitch={handleAuthSwitch} />
              )}
            </div>
          </div>
        ) : (
          <>
            {view === "home" && (
              <ChallengeRunner
                challenge={challenge}
                token={token}
                onNext={() => loadRandom(challenge?._id)}
              />
            )}

            {view === "profile" && <Profile token={token} onLogout={logout} />}
            {view === "leaderboard" && <Leaderboard />}
            {view === "generator" && <Generator token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
