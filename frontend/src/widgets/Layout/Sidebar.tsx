import { useNavigate } from "react-router-dom";
import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import { IconCommentStroked } from "@consta/icons/IconCommentStroked";
import { IconSettings } from "@consta/icons/IconSettings";

export const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <Layout direction="column" className="sidebar">
      <Button
        iconLeft={IconCommentStroked}
        size="m"
        label="Чат"
        onClick={() => navigate("/app/chat")}
        view="ghost"
      />
      <Button
        iconLeft={IconSettings}
        size="m"
        label="Интеграции"
        onClick={() => navigate("/app/integrations")}
        view="ghost"
      />
    </Layout>
  );
};
