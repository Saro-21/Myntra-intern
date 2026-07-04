// Central API base URL
// For local dev:      set EXPO_PUBLIC_API_URL=http://localhost:5000 in .env
// For production:     falls back to the deployed Render backend
const RENDER_BACKEND_URL = "https://web-developement-intern.onrender.com";

const API_URL: string =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? RENDER_BACKEND_URL;

export default API_URL;
