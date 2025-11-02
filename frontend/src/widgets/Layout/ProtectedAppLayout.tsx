import { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import { Loader } from "@consta/uikit/Loader";
import { MainLayout } from "./MainLayout";
import { WorkspaceProvider, RoleProvider } from "@/app/providers";

export const ProtectedAppLayout = () => {
  const { login, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // OAuth callback: обрабатываем token и refresh из URL после авторизации
  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");

    if (token && refresh) {
      login(token, refresh);
      navigate("/app/chat", { replace: true });
    }
  }, [searchParams, login, navigate]);

  // Проверка авторизации: редирект на /auth если не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
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
