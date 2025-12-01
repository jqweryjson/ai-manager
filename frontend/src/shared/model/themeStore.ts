import type { ThemeName } from "@/shared/types/theme";

const THEME_STORAGE_KEY = "theme_preference";

type Listener = () => void;

interface ThemeState {
  theme: ThemeName;
}

interface ThemeStore {
  getState: () => ThemeState;
  setTheme: (theme: ThemeName) => void;
  subscribe: (listener: Listener) => () => void;
}

const listeners = new Set<Listener>();

function readInitialTheme(): ThemeName {
  if (typeof window === "undefined") {
    return "dark";
  }

  const saved = window.localStorage.getItem(
    THEME_STORAGE_KEY
  ) as ThemeName | null;

  if (saved === "default" || saved === "dark") {
    return saved;
  }

  return "dark";
}

let state: ThemeState = {
  theme: readInitialTheme(),
};

export const themeStore: ThemeStore = {
  getState: () => state,
  setTheme: (theme: ThemeName) => {
    if (state.theme === theme) return;

    state = { ...state, theme };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    listeners.forEach(listener => listener());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
