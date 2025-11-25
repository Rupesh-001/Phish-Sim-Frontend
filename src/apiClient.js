// src/apiClient.js
import { API_BASE } from "./config";

/**
 * apiFetch wraps fetch so you always call the right backend.
 * Usage: apiFetch("/api/auth/login", { method: "POST", body, headers })
 */
export async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);

  // optional: throw rich error for caller
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  // try parse JSON, otherwise return raw text
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
