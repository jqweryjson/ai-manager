import { useState, useEffect, useMemo } from "react";
import { presetGpnDefault, presetGpnDark } from "@consta/uikit/Theme";
import type { ThemeName, ThemePreset } from "@/shared/types/theme";

const THEME_STORAGE_KEY = "theme_preference";

export const availableThemes: ThemePreset[] = [
  {
    name: "default",
    preset: presetGpnDefault,
    label: "Светлая тема",
    icon: "sun",
  },
  {
    name: "dark",
    preset: presetGpnDark,
    label: "Тёмная тема",
    icon: "moon",
  },
];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>("default");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName;
    if (saved && availableThemes.some(t => t.name === saved)) {
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const currentPreset = useMemo(
    () => availableThemes.find(t => t.name === theme)?.preset || presetGpnDark,
    [theme]
  );

  return {
    theme,
    setTheme,
    currentPreset,
    availableThemes,
  };
}
