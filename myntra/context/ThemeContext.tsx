import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/Colors";

export type ThemeType = "light" | "dark" | "myntra";
export type ThemeSelection = ThemeType | "system";

export type ThemeColors = typeof Colors.light;

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  isSystem: boolean;
  currentSelection: ThemeSelection;
  setTheme: (theme: ThemeSelection) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "myntra_theme_selection";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [currentSelection, setCurrentSelection] = useState<ThemeSelection>("system");
  const [activeTheme, setActiveTheme] = useState<ThemeType>("light");

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTheme) {
          setCurrentSelection(storedTheme as ThemeSelection);
        } else {
          // First launch auto-detection
          // The platform must automatically detect device appearance settings on first launch
          const systemTheme = Appearance.getColorScheme() || "light";
          setCurrentSelection("system");
          await AsyncStorage.setItem(STORAGE_KEY, "system");
        }
      } catch (error) {
        console.error("Failed to load theme preference from AsyncStorage", error);
      }
    };
    loadTheme();
  }, []);

  // Update active theme dynamically when selection or system preference changes
  useEffect(() => {
    if (currentSelection === "system") {
      const resolved = systemColorScheme === "dark" ? "dark" : "light";
      setActiveTheme(resolved);
    } else {
      setActiveTheme(currentSelection);
    }
  }, [currentSelection, systemColorScheme]);

  const setTheme = async (newTheme: ThemeSelection) => {
    try {
      setCurrentSelection(newTheme);
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme preference to AsyncStorage", error);
    }
  };

  const colors = Colors[activeTheme] || Colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        colors,
        isSystem: currentSelection === "system",
        currentSelection,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
