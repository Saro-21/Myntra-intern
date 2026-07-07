import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { Platform } from "react-native";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { ThemeProvider as AppThemeProvider, useTheme } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";

// Global web-only stylesheet — god-level design system
const webStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
  }

  * {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Hide scrollbars system-wide for native app feel */
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; -ms-overflow-style: none; }

  /* Smooth scroll */
  html { scroll-behavior: smooth; }

  /* Prevent text selection on interactive elements */
  button, [role="button"] {
    user-select: none;
    -webkit-user-select: none;
  }

  /* Optimise image rendering */
  img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  /* Card lift on hover — snappy spring feel */
  .hover-grow {
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.22s ease,
                filter 0.18s ease !important;
    will-change: transform;
  }
  .hover-grow:hover {
    transform: translateY(-8px) scale(1.018) !important;
    box-shadow: 0 24px 40px -8px rgba(0, 0, 0, 0.18), 0 8px 16px -4px rgba(0, 0, 0, 0.1) !important;
    filter: brightness(1.02) !important;
    z-index: 10;
    position: relative;
  }

  .hover-slide-right {
    transition: transform 0.2s ease !important;
  }
  .hover-slide-right:hover {
    transform: translateX(5px) !important;
  }

  /* Glowing CTA buttons */
  .hover-glow-button {
    transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease !important;
    will-change: transform;
  }
  .hover-glow-button:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 0 28px rgba(255, 0, 85, 0.55) !important;
    filter: brightness(1.08) !important;
  }

  /* Glassmorphism utilities */
  .glass-card {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
  }

  .dark-glass-card {
    background: rgba(21, 21, 33, 0.72) !important;
    backdrop-filter: blur(28px) saturate(160%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(160%) !important;
    border: 1px solid rgba(255, 255, 255, 0.07) !important;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45) !important;
  }

  /* ── Banner carousel (web) ── */
  .banner-reel {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    height: 100%;
    /* hide scrollbar across all engines */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .banner-reel::-webkit-scrollbar { display: none; }

  .banner-slide {
    min-width: 100%;
    height: 100%;
    scroll-snap-align: start;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }

  .banner-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* remove browser's quirky image rendering on web export */
    image-rendering: auto;
  }

  .banner-caption {
    position: absolute;
    bottom: 32px;
    left: 26px;
    right: 26px;
    animation: bannerFadeUp 0.5s ease both;
  }

  @keyframes bannerFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}

function RootLayoutContent() {
  const { theme, colors } = useTheme();

  const baseTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  // High contrast custom navigation theme
  const customNavTheme = {
    ...baseTheme,
    dark: theme === "dark",
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <ThemeProvider value={customNavTheme}>
      {Platform.OS === "web" && (
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      )}
      <AuthProvider>
        <NotificationProvider>
          <RecentlyViewedProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
            </Stack>
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
          </RecentlyViewedProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

