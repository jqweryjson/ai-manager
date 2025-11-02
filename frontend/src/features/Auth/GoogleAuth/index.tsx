import { Button } from "@consta/uikit/Button";

export const GoogleAuthButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
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
