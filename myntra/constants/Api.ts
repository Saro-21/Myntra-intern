// Central API base URL resolution:
//
// Priority 1 — Explicit override (e.g. local dev):
//   set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
//
// Priority 2 — Web browser (Vercel deployment):
//   Uses the built-in Vercel Serverless Function at /api (same origin = no CORS)
//   The serverless function in myntra/api/[...path].js connects to MongoDB directly.
//
// Priority 3 — Native mobile (Expo Go / standalone APK/IPA):
//   Uses the Render backend directly: https://web-developement-intern.onrender.com
//   CORS is configured on Render to allow requests from the Vercel domain.
//
export const RENDER_BACKEND_URL = "https://web-developement-intern.onrender.com";

const API_URL: string = (() => {
  // Explicit override wins (local dev, CI, etc.)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Web browser on Vercel → use same-origin /api (no CORS, no cold starts)
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return `${window.location.origin}/api`;
  }
  // Native mobile → Render backend
  return RENDER_BACKEND_URL;
})();

export default API_URL;
