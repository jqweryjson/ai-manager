import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@consta/uikit/Modal";
import { Text } from "@consta/uikit/Text";
import { Card } from "@consta/uikit/Card";
// TODO
// import { LoginForm } from "@/features/Auth/LoginForm";
import { GoogleAuthButton } from "@/features/Auth/GoogleAuth";
import { TelegramAuthButton } from "@/features/Auth/TelegramAuth";
import { useAuth } from "@shared/hooks/useAuth";
// import type { LoginFormData } from "@shared/lib/validation";
import { Layout } from "@consta/uikit/Layout";

export const AuthPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app/chat", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Modal isOpen onClickOutside={() => {}} onEsc={() => {}}>
      <Card
        verticalSpace="2xl"
        horizontalSpace="2xl"
        style={{ maxWidth: "500px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xl)",
          }}
        >
          <Text size="2xl" weight="bold" align="center" view="primary">
            Вход в систему
          </Text>

          {/* <LoginForm onSubmit={handleLogin} /> */}

          <Layout
            style={{
              alignItems: "center",
              gap: "var(--space-m)",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "var(--color-bg-border)",
              }}
            />
            <Text size="s" view="secondary">
              Войти через
            </Text>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "var(--color-bg-border)",
              }}
            />
          </Layout>

          <Layout
            style={{
              alignItems: "center",
              gap: "var(--space-s)",
              flexWrap: "wrap",
            }}
          >
            <TelegramAuthButton />
            <GoogleAuthButton />
          </Layout>
        </div>
      </Card>
    </Modal>
  );
};
