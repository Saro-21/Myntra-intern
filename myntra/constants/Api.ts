// Central API base URL
// For local dev:      EXPO_PUBLIC_API_URL=http://localhost:5000  (set in .env)
// For production:     EXPO_PUBLIC_API_URL=https://<your-render-url>.onrender.com (set in Vercel dashboard)

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (typeof window !== "undefined" ? window.location.origin + "/api" : "/api");

export default API_URL;
