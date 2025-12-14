import { useMemo, useState } from "react";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  );

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const isAuthenticated = Boolean(token);

  return useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      token,
      getToken,
    }),
    [isAuthenticated, token]
  );
}
