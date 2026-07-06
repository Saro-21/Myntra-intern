// Central API base URL resolution:
//
// Priority 1 — Explicit override (e.g. local dev):
//   set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
//
// Priority 2 — Production (Web & Native):
//   Uses the Render backend directly: https://web-developement-intern.onrender.com
//   CORS is configured on Render to allow requests from https://myntra-pearl.vercel.app
//
export const RENDER_BACKEND_URL = "https://web-developement-intern.onrender.com";

const API_URL: string = (() => {
  // Explicit override wins (local dev, CI, etc.)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Fall back to Render backend directly
  return RENDER_BACKEND_URL;
})();

export default API_URL;


