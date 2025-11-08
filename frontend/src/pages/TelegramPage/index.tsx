import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@consta/uikit/Loader";
import { Text } from "@consta/uikit/Text";
import { useAuth } from "@shared/hooks/useAuth";
import { telegramAuth } from "@shared/api/telegram";

// Расширяем Window для TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
        };
        BackButton: {
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

export const TelegramPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Если уже авторизован, переходим в приложение
    if (isAuthenticated) {
      navigate("/app/chat", { replace: true });
      return;
    }

    // Проверяем, что мы в Telegram WebApp
    if (!window.Telegram?.WebApp) {
      setError("Это приложение доступно только в Telegram");
      setLoading(false);
      return;
    }

    const tg = window.Telegram.WebApp;

    // Инициализация Telegram WebApp
    tg.ready();
    tg.expand();

    // Получаем initData
    const initData = tg.initData;

    if (!initData) {
      setError("Не удалось получить данные авторизации");
      setLoading(false);
      return;
    }

    // Авторизация через бэкенд
    const authenticate = async () => {
      try {
        setLoading(true);
        const response = await telegramAuth(initData);

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
