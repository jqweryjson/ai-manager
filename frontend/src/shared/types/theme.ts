export type ThemeName = "default" | "dark";

export interface ThemePreset {
  name: ThemeName;
  preset: unknown;
  label: string;
  icon: string;
}
