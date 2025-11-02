import { Button } from "@consta/uikit/Button";
import { API_BASE_URL } from "@shared/config/api";

export const GoogleAuthButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <Button
      label="Войти через Google"
      view="secondary"
      size="l"
      width="full"
      onClick={handleGoogleLogin}
    />
  );
};
