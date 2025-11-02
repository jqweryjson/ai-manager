import { Theme, type ThemePreset } from "@consta/uikit/Theme";
import type { ReactNode } from "react";
import { useTheme } from "@/shared/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { currentPreset } = useTheme();

  return (
    <Theme preset={currentPreset as ThemePreset} style={{ height: "100%" }}>
      {children}
    </Theme>
  );
};
