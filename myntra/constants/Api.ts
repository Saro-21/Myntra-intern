// Central API base URL resolution:
//
// Priority 1 — Explicit override (e.g. local dev):
//   set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
//
// Priority 2 — Production (Web & Native):
//   Uses the Render backend directly: https://myntra-intern.onrender.com
//   CORS is configured on Render to allow requests from the Vercel domain.
//
import { Platform } from "react-native";

export const RENDER_BACKEND_URL = "https://myntra-intern.onrender.com";

const API_URL: string = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return "http://localhost:5000";
    }
    return "/api";
  }
  return RENDER_BACKEND_URL;
})();

export default API_URL;
