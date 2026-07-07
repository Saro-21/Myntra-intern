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

// Global web-only stylesheet to enable god-level designs
const webStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  * {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  }

  .hover-grow {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .hover-grow:hover {
    transform: translateY(-6px) scale(1.025) !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08) !important;
  }

  .hover-slide-right {
    transition: all 0.25s ease !important;
  }
  .hover-slide-right:hover {
    transform: translateX(6px) !important;
  }

  .hover-glow-button {
    transition: all 0.3s ease !important;
  }
  .hover-glow-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 0 20px rgba(255, 0, 85, 0.45) !important;
    filter: brightness(1.05) !important;
  }

  /* Custom glassmorphism cards */
  .glass-card {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
  }

  .dark-glass-card {
    background: rgba(21, 21, 33, 0.75) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4) !important;
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

