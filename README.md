# Myntra Clone — Full-Stack React Native + Expo Web App

A feature-rich Myntra clone built with **React Native (Expo)** for the frontend and a **Node.js/Express/MongoDB** backend — deployed as **Vercel Serverless Functions**.

🌐 **Live URL:** [https://myntra-pearl.vercel.app](https://myntra-pearl.vercel.app)

---

## ✨ Features

### Core (Training Project)
- 🛍️ Browse products by category (Men, Women, Kids, Beauty)
- 🔍 Product detail pages with image gallery and size selector
- 🛒 Shopping Bag — add, remove, and checkout
- ❤️ Wishlist — save favourite products
- 👤 Authentication — Sign Up / Login / Logout
- 📦 Orders — place and track orders

### Internship Extra Feature: Hybrid Recently Viewed (Cross-Device Sync)
- 👁️ Anonymous browsing history stored locally (SecureStore)
- ☁️ Auto-syncs to MongoDB when user logs in
- 🔄 Cross-device sync — view history on any device
- 🗑️ Clear history button
- 📱 Dedicated "Recently Viewed" page accessible from Profile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native, Expo Router, TypeScript |
| Web Deploy | Vercel (static + serverless) |
| Backend | Node.js + Express (Vercel Serverless Functions) |
| Database | MongoDB Atlas |
| Auth | bcryptjs |
| State | React Context API |
| Storage | expo-secure-store (local cache) |

---

## 🗂️ Project Structure

```
myntra/
├── app/              # Expo Router screens
│   ├── (tabs)/       # Bottom tab screens (Home, Categories, Wishlist, Bag, Profile)
│   ├── (auth)/       # Login & Signup
│   ├── product/[id]  # Product detail
│   └── recently-viewed.tsx
├── api/              # Vercel Serverless Functions (full backend)
│   └── [...path].js  # Catch-all API handler (product, category, user, bag, wishlist, order, recently-viewed)
├── context/          # React Context providers (Auth, RecentlyViewed)
├── constants/        # API URL config
└── vercel.json       # Vercel build + routing config
backend/              # Local Express server (for local development)
```

---

## 🚀 Running Locally

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI and PORT=5000
npm run dev       # Starts on http://localhost:5000
```

### Frontend
```bash
cd myntra
npm install
# Create .env with EXPO_PUBLIC_API_URL=http://localhost:5000
npm run web       # Opens http://localhost:8081
```

---

## 🌍 Deployment

- **Frontend + API:** Deployed on [Vercel](https://vercel.com) — serverless functions handle all backend logic
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- Live: [https://myntra-pearl.vercel.app](https://myntra-pearl.vercel.app)
