import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@shared/config/api";
import { useAuth } from "@shared/hooks/useAuth";
import { isTelegramMiniApp } from "@shared/lib/isTelegramMiniApp";

interface TelegramLoginWidgetUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Глобальная функция для обработки callback от Telegram Widget
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramLoginWidgetUser) => void;
  }
}

export const TelegramAuthButton = () => {
  const { login } = useAuth();
  const widgetRef = useRef<HTMLDivElement>(null);
  const processed = useRef(false);

  // Telegram Login Widget НЕ работает внутри Mini App
  // В Mini App используется своя авторизация через initData
  const isMiniApp = isTelegramMiniApp();

  useEffect(() => {
    // Не инициализируем виджет внутри Mini App
    if (isMiniApp) return;
    // Устанавливаем глобальную функцию callback
    window.onTelegramAuth = async (user: TelegramLoginWidgetUser) => {
      if (processed.current) return;
      processed.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/telegram-web`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        login(data.accessToken, data.refreshToken);
        // Используем window.location.href для полной перезагрузки,
        // чтобы гарантировать обновление состояния и избежать гонки условий
        window.location.href = "/app/chat";
      } catch (error) {
        console.error("Telegram auth error:", error);
        alert("Ошибка авторизации через Telegram");
        processed.current = false;
      }
    };

    // Очистка при размонтировании
    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [login, isMiniApp]);

  useEffect(() => {
    // Не инициализируем виджет внутри Mini App
    if (isMiniApp || !widgetRef.current) return;

    // Используем bot_username (имя бота, например "my_bot"), а не bot_id
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      console.error("VITE_TELEGRAM_BOT_USERNAME is not set");
      return;
    }

    // Создаем script тег для Telegram Login Widget
    // Виджет автоматически создаст iframe с кнопкой
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    widgetRef.current.innerHTML = "";
    widgetRef.current.appendChild(script);

    return () => {
      const current = widgetRef.current;
      if (current) {
        current.innerHTML = "";
      }
    };
  }, [isMiniApp]);

  // Не показываем виджет внутри Mini App
  if (isMiniApp) {
    return null;
  }

  return <div ref={widgetRef} />;
};
