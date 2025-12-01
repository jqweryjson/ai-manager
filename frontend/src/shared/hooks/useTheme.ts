import { useMemo, useSyncExternalStore } from "react";
import { presetGpnDefault, presetGpnDark } from "@consta/uikit/Theme";
import type { ThemeName, ThemePreset } from "@/shared/types/theme";
import { themeStore } from "@/shared/model/themeStore";

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
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    () => themeStore.getState().theme,
    () => "dark"
  );

  const setTheme = (newTheme: ThemeName) => {
    themeStore.setTheme(newTheme);
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
