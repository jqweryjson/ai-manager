import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@consta/uikit/Button";
import { IconCommentFilled } from "@consta/icons/IconCommentFilled";
import { IconShare } from "@consta/icons/IconShare";
import { IconSettings } from "@consta/icons/IconSettings";
import { Text } from "@consta/uikit/Text";
import { Layout } from "@consta/uikit/Layout";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          style={{ width: "auto", padding: "0 var(--space-xs)" }}
          iconLeft={() => (
            <Layout
              direction="column"
              align="center"
              gap="xs"
              style={{ alignItems: "center" }}
            >
              <IconCommentFilled size="m" />
              <Text
                size="xs"
                weight="bold"
                view="secondary"
                style={{ lineHeight: 1 }}
              >
                Чат
              </Text>
            </Layout>
          )}
          view={isActive("/app/chat") ? "primary" : "clear"}
          size="m"
          title="Чат"
          onClick={() => navigate("/app/chat")}
        />
      </div>
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          style={{ width: "auto", padding: "0 var(--space-xs)" }}
          iconLeft={() => (
            <Layout
              direction="column"
              align="center"
              gap="xs"
              style={{ alignItems: "center" }}
            >
              <IconShare size="m" />
              <Text
                size="xs"
                weight="bold"
                view="secondary"
                style={{ lineHeight: 1 }}
              >
                Интеграции
              </Text>
            </Layout>
          )}
          view={isActive("/app/integrations") ? "primary" : "clear"}
          size="m"
          title="Интеграции"
          onClick={() => navigate("/app/integrations")}
        />
      </div>
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          style={{ width: "auto", padding: "0 var(--space-xs)" }}
          iconLeft={() => (
            <Layout
              direction="column"
              align="center"
              gap="xs"
              style={{ alignItems: "center" }}
            >
              <IconSettings size="m" />
              <Text
                size="xs"
                weight="bold"
                view="secondary"
                style={{ lineHeight: 1 }}
              >
                Настройки
              </Text>
            </Layout>
          )}
          view={isActive("/app/settings") ? "primary" : "clear"}
          size="m"
          title="Настройки"
          onClick={() => navigate("/app/settings")}
        />
      </div>
    </div>
  );
};
