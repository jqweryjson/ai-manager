import { Layout } from "@consta/uikit/Layout";
import { User } from "@consta/uikit/User";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { Loader } from "@consta/uikit/Loader";
import { IconSun } from "@consta/icons/IconSun";
import { IconMoon } from "@consta/icons/IconMoon";
import { IconExit } from "@consta/icons/IconExit";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import { useCurrentUserQuery } from "@shared/hooks/useUser";
import { useTheme } from "@shared/hooks/useTheme";
import { isTelegramMiniApp } from "@shared/lib/isTelegramMiniApp";
import { logout as apiLogout } from "@/entities/User";

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/app/chat", title: "Чат" },
  { prefix: "/app/integrations", title: "Интеграции" },
  { prefix: "/app/settings", title: "Настройки" },
  { prefix: "/app", title: "AI Ассистент" },
  { prefix: "/tg", title: "Telegram Mini App" },
  { prefix: "/auth", title: "Авторизация" },
];

function getPageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(item => pathname.startsWith(item.prefix));
  return match ? match.title : "AI Ассистент";
}

export const Header = () => {
  const { logout: clearAuth } = useAuth();
  const { data: user, isLoading } = useCurrentUserQuery();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = getPageTitle(location.pathname);
  const isMiniApp = isTelegramMiniApp();

  const toggleTheme = () => {
    setTheme(theme === "default" ? "dark" : "default");
  };

  const handleLogout = async () => {
    try {
      // Вызываем API logout для очистки сессии на сервере
      await apiLogout();
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      // Продолжаем выход даже если API запрос не удался
    } finally {
      // Очищаем токены из localStorage
      clearAuth();
      // Редиректим на страницу авторизации
      navigate("/auth", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <Layout
        direction="row"
        className="header"
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader size="s" />
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout direction="row" className="header">
      <Layout direction="row" className="header__left">
        <Text className="header__title" view="primary">
          {currentTitle}
        </Text>
      </Layout>

      <Layout direction="row" className="header__right">
        <Button
          onlyIcon
          iconLeft={theme === "default" ? IconMoon : IconSun}
          view="ghost"
          size="s"
          onClick={toggleTheme}
          title={
            theme === "default"
              ? "Переключить на тёмную тему"
              : "Переключить на светлую тему"
          }
        />
        <User
          name={user.name}
          info={user.email}
          avatarUrl={user.picture}
          size="s"
        />
        {/* В Telegram Mini App кнопку "Выйти" не показываем */}
        {!isMiniApp && (
          <Button
            onlyIcon
            iconLeft={() => <IconExit size="s" />}
            label="Выйти"
            view="ghost"
            size="xs"
            onClick={handleLogout}
          />
        )}
      </Layout>
    </Layout>
  );
};
