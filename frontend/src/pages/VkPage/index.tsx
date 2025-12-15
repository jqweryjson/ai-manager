import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@consta/uikit/Loader";
import { Text } from "@consta/uikit/Text";
import { useAuth } from "@shared/hooks/useAuth";
import { vkAuth } from "@shared/api/vk";
import { getVkParams, isVkMiniApp } from "@shared/lib/isVkMiniApp";

// Расширяем Window для TypeScript
declare global {
  interface Window {
    VK?: {
      init: (params: { apiId: number }) => void;
      getParams: () => string;
      [key: string]: unknown;
    };
  }
}

export const VkPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, что мы в VK Mini App
    if (!isVkMiniApp()) {
      setError("Это приложение доступно только в VK");
      setLoading(false);
      return;
    }

    // VK Mini App SDK инициализируется автоматически
    // vk-params уже содержит все необходимые данные для авторизации

    // Если уже авторизован и мы внутри VK, просто переходим в чат
    if (isAuthenticated) {
      navigate("/app/chat", { replace: true });
      return;
    }

    // Получаем vk-params
    const vkParams = getVkParams();

    if (!vkParams) {
      setError("Не удалось получить данные авторизации");
      setLoading(false);
      return;
    }

    // Авторизация через бэкенд
    const authenticate = async () => {
      try {
        setLoading(true);
        const response = await vkAuth(vkParams);

        // Сохраняем токены
        login(response.accessToken, response.refreshToken);

        // Переходим в приложение
        navigate("/app/chat", { replace: true });
      } catch (err: unknown) {
        console.error("Ошибка авторизации:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Ошибка авторизации. Попробуйте позже."
        );
        setLoading(false);
      }
    };

    authenticate();
  }, [navigate, login, isAuthenticated]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "var(--space-xl)",
          padding: "var(--space-xl)",
        }}
      >
        <Text size="xl" weight="bold" view="alert">
          Ошибка
        </Text>
        <Text size="m" view="secondary" align="center">
          {error}
        </Text>
      </div>
    );
  }

  if (!loading) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "var(--space-xl)",
      }}
    >
      <Loader size="m" />
      <Text size="m" view="secondary">
        Авторизация...
      </Text>
    </div>
  );
};
