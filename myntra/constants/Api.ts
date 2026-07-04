// Central API base URL
// For local dev:      EXPO_PUBLIC_API_URL=http://localhost:5000  (set in .env)
// For production:     EXPO_PUBLIC_API_URL=https://<your-render-url>.onrender.com (set in Vercel dashboard)
const RENDER_BACKEND_URL = "https://myntra-clone-xj36.onrender.com";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  RENDER_BACKEND_URL;

export default API_URL;
