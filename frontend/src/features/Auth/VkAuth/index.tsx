import { useEffect, useRef } from "react";
import { isVkMiniApp } from "@shared/lib/isVkMiniApp";
import { vkIdAuth } from "@shared/api/vk";
import { useAuth } from "@shared/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Типы для VK ID SDK
declare global {
  interface Window {
    VKIDSDK?: {
      Config: {
        init: (config: {
          app: number;
          redirectUrl: string;
          responseMode: string;
          source: string;
          scope?: string;
        }) => void;
        ConfigResponseMode: {
          Callback: string;
        };
        ConfigSource: {
          LOWCODE: string;
        };
      };
      OAuthList: new () => {
        render: (options: {
          container: HTMLElement;
          styles?: {
            borderRadius?: number;
            height?: number;
          };
          oauthList: string[];
        }) => {
          on: (
            event: string,
            handler: (payload: unknown) => void
          ) => {
            on: (event: string, handler: (payload: unknown) => void) => unknown;
          };
        };
      };
      WidgetEvents: {
        ERROR: string;
      };
      OAuthListInternalEvents: {
        LOGIN_SUCCESS: string;
      };
      Auth: {
        exchangeCode: (
          code: string,
          deviceId: string
        ) => Promise<{
          access_token: string;
          user_id: number;
          expires_in?: number;
        }>;
      };
    };
  }
}

export const VkAuthButton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // VK Mini App использует автоматическую авторизацию через ProtectedAppLayout
    // Не показываем кнопку внутри Mini App
    if (isVkMiniApp()) {
      return;
    }

    // Загружаем VK ID SDK если еще не загружен
    if (!window.VKIDSDK) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
      script.async = true;
      script.onload = () => {
        // SDK загружен, инициализируем виджет
        initializeVkId();
      };
      document.head.appendChild(script);
      return;
    }

    // SDK уже загружен, инициализируем виджет
    initializeVkId();

    function initializeVkId() {
      if (!window.VKIDSDK || !containerRef.current) {
        return;
      }

      const VKID = window.VKIDSDK;
      const VK_APP_ID = import.meta.env.VITE_VK_APP_ID
        ? Number(import.meta.env.VITE_VK_APP_ID)
        : undefined;

      if (!VK_APP_ID) {
        console.error("VITE_VK_APP_ID is not set");
        return;
      }

      // Инициализация VK ID SDK
      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: window.location.origin,
        responseMode: VKID.Config.ConfigResponseMode.Callback,
        source: VKID.Config.ConfigSource.LOWCODE,
        scope: "email",
      });

      // Создаем виджет авторизации
      const oAuth = new VKID.OAuthList();
      const container = containerRef.current;

      if (!container) {
        return;
      }

      oAuth
        .render({
          container,
          styles: {
            borderRadius: 4,
            height: 40,
          },
          oauthList: ["vkid"], // Только VK ID, можно добавить 'ok_ru', 'mail_ru'
        })
        .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
          console.error("VK ID error:", error);
          alert("Ошибка авторизации через VK");
        })
        .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload: unknown) => {
          const loginPayload = payload as {
            code?: string;
            device_id?: string;
          };
          const code = loginPayload.code;
          const deviceId = loginPayload.device_id;

          if (!code || !deviceId) {
            console.error("Missing code or device_id");
            return;
          }

          // Отправляем code на бэкенд для обмена на токены
          vkIdAuth(code, deviceId)
            .then(response => {
              login(response.accessToken, response.refreshToken);
              navigate("/app/chat", { replace: true });
            })
            .catch(error => {
              console.error("VK ID auth error:", error);
              alert("Ошибка авторизации через VK");
            });
        });
    }
  }, [login, navigate]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "flex-start",
      }}
    />
  );
};
