// Central API base URL resolution:
//
// Priority 1 — Explicit override (e.g. local dev):
//   set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
//
// Priority 2 — Web browser (Vercel deployment):
//   Uses the built-in Vercel Serverless Functions at /api (same origin, no CORS, no cold starts)
//   These proxy to the same MongoDB — always available even during Render cold starts.
//
// Priority 3 — Native mobile (Expo Go / standalone APK/IPA):
//   Uses the Render backend directly: https://web-developement-intern.onrender.com
//
export const RENDER_BACKEND_URL = "https://web-developement-intern.onrender.com";

const API_URL: string = (() => {
  // Explicit override wins (local dev, CI, etc.)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Web browser → same-origin Vercel serverless (instant, no cold start)
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  // Native mobile → Render backend
  return RENDER_BACKEND_URL;
})();

export default API_URL;

