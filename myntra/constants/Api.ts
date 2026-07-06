// Central API base URL resolution:
//
// Priority 1 — Explicit override (e.g. local dev):
//   set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
//
// Priority 2 — Web browser on Vercel:
//   Uses the built-in Vercel Serverless Functions at /api (same origin, no CORS, no cold starts)
//
// Priority 3 — Native mobile (Expo Go / standalone APK/IPA):
//   Falls back to the Render backend for direct HTTP access
//
const RENDER_BACKEND_URL = "https://web-developement-intern.onrender.com";

const API_URL: string = (() => {
  // If an explicit override is set (local dev or custom config), always use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // On web (Vercel deployment), use the same-origin /api serverless functions
  // This avoids CORS, cold starts, and connectivity issues with Render
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  // On native (Expo Go, Android, iOS), use the Render backend directly
  return RENDER_BACKEND_URL;
})();

export default API_URL;
