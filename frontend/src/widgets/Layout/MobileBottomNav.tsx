import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@consta/uikit/Button";
import { IconCommentFilled } from "@consta/icons/IconCommentFilled";
import { IconShare } from "@consta/icons/IconShare";
import { IconSettings } from "@consta/icons/IconSettings";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          iconLeft={IconCommentFilled}
          view={isActive("/app/chat") ? "primary" : "clear"}
          size="m"
          title="Чат"
          onClick={() => navigate("/app/chat")}
        />
      </div>
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          iconLeft={IconShare}
          view={isActive("/app/integrations") ? "primary" : "clear"}
          size="m"
          title="Интеграции"
          onClick={() => navigate("/app/integrations")}
        />
      </div>
      <div className="mobile-bottom-nav__button">
        <Button
          onlyIcon
          iconLeft={IconSettings}
          view={isActive("/app/settings") ? "primary" : "clear"}
          size="m"
          title="Настройки"
          onClick={() => navigate("/app/settings")}
        />
      </div>
    </div>
  );
};
