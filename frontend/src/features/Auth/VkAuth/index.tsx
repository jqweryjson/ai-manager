import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Auth, OAuthName } from "@vkid/sdk";
import type { AuthResponse } from "@vkid/sdk";
import { useAuth } from "@shared/hooks/useAuth";
import { isVkMiniApp } from "@shared/lib/isVkMiniApp";
import { vkidLogin } from "@shared/api/vk";
import { initVkid, renderVkidOAuthList } from "@shared/lib/vkid";

export const VkAuthButton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Внутри VK Mini App авторизация идёт через vk-params (ProtectedAppLayout)
    if (isVkMiniApp()) {
      return;
    }

    const appIdRaw = import.meta.env.VITE_VK_APP_ID;
    const appId = appIdRaw ? Number(appIdRaw) : NaN;

    if (!appId || Number.isNaN(appId)) {
      console.error("VITE_VK_APP_ID is not set");
      return;
    }

    // VK ID SDK: callback mode + lowcode
    initVkid({
      appId,
      redirectUrl: window.location.origin,
      scope: "email",
    });

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // на всякий случай очищаем контейнер при повторном рендере
    container.innerHTML = "";

    const widget = renderVkidOAuthList({
      container,
      oauthList: [OAuthName.VK],
      styles: { borderRadius: 4, height: 40 },
      onError: err => {
        console.error("VK ID widget error:", err);
        alert("Ошибка авторизации через VK");
      },
      onLoginSuccess: async (payload: AuthResponse) => {
        try {
          // Шаг 1: exchange code -> tokens (делаем на фронте через SDK)
          const token = await Auth.exchangeCode(
            payload.code,
            payload.device_id
          );

          // Шаг 2: backend верифицирует access_token и выдаёт наши JWT
          const res = await vkidLogin(token.access_token);

          login(res.accessToken, res.refreshToken);
          navigate("/app/chat", { replace: true });
        } catch (err) {
          console.error("VK ID login error:", err);
          alert("Ошибка авторизации через VK");
        }
      },
    });

    return () => {
      widget.close();
    };
  }, [login, navigate]);

  return <div ref={containerRef} style={{ display: "flex" }} />;
};
