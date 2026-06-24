// Central API base URL
// For local dev:        EXPO_PUBLIC_API_URL=http://localhost:5000  (set in .env)
// For Vercel production: EXPO_PUBLIC_API_URL=/api                  (set in build command)
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://myntra-clone-xj36.onrender.com";

export default API_URL;
