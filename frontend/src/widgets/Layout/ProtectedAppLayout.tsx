import { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import { Loader } from "@consta/uikit/Loader";
import { MainLayout } from "./MainLayout";
import { WorkspaceProvider, RoleProvider } from "@/app/providers";
import { isTelegramMiniApp } from "@/shared/lib/isTelegramMiniApp";
import { telegramAuth } from "@/shared/api/telegram";
import { isVkMiniApp, getVkParams } from "@/shared/lib/isVkMiniApp";
import { vkMiniAppAuth } from "@/shared/api/vk";

export const ProtectedAppLayout = () => {
  const { login, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // OAuth callback: обрабатываем token и refresh из URL после авторизации (обычный веб)
  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");

    if (token && refresh) {
      login(token, refresh);
      navigate("/app/chat", { replace: true });
    }
  }, [searchParams, login, navigate]);

  // Авто‑логин через Telegram Mini App
  useEffect(() => {
    // Только для Telegram Mini App
    if (!isTelegramMiniApp()) {
      return;
    }

    // Если уже авторизованы — ничего не делаем
    if (isAuthenticated) {
      return;
    }

    try {
      const w = window as unknown as {
        Telegram?: { WebApp?: { initData?: string } };
      };
      const initData = w.Telegram?.WebApp?.initData;

      if (!initData) {
        return;
      }

      // Пытаемся авторизоваться через /tg/auth
      telegramAuth(initData)
        .then(res => {
          login(res.accessToken, res.refreshToken);
          // В Mini App можно сразу перейти в основной экран
          navigate("/app/chat", { replace: true });
        })
        .catch(() => {
          // Если Telegram‑авторизация не удалась — просто оставляем стандартный флоу (редирект на /auth)
        });
    } catch {
      // Игнорируем ошибки детекта Mini App
    }
  }, [isAuthenticated, login, navigate]);

  // Авто‑логин через VK Mini App
  useEffect(() => {
    // Только для VK Mini App
    if (!isVkMiniApp()) {
      return;
    }

    // Если уже авторизованы — ничего не делаем
    if (isAuthenticated) {
      return;
    }

    try {
      const vkParams = getVkParams();

      if (!vkParams) {
        return;
      }

      // Пытаемся авторизоваться через /vk/auth
      vkMiniAppAuth(vkParams)
        .then(res => {
          login(res.accessToken, res.refreshToken);
          // В Mini App можно сразу перейти в основной экран
          navigate("/app/chat", { replace: true });
        })
        .catch(() => {
          // Если VK‑авторизация не удалась — просто оставляем стандартный флоу (редирект на /auth)
        });
    } catch {
      // Игнорируем ошибки детекта Mini App
    }
  }, [isAuthenticated, login, navigate]);

  // Проверка авторизации:
  // - для обычного веба: редирект на /auth
  // - для Telegram/VK Mini App: ждём авто‑логин через /tg/auth или /vk/auth (см. хуки выше),
  //   а если он не удался, всё равно редирект на /auth
  useEffect(() => {
    if (!isAuthenticated) {
      // Для Mini App даём шанс авторизации отработать первой,
      // но чтобы не менять сильно логику, оставляем тот же редирект.
      // Главное, что форма логина не будет показана в самом iframe мини‑аппа.
      if (!isTelegramMiniApp() && !isVkMiniApp()) {
        navigate("/auth", { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  // Показываем Loader пока проверяем авторизацию
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loader />
      </div>
    );
  }

  // Рендерим MainLayout с дочерними роутами через <Outlet />
  return (
    <WorkspaceProvider>
      <RoleProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </RoleProvider>
    </WorkspaceProvider>
  );
};
