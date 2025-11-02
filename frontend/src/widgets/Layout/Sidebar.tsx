import { useNavigate } from "react-router-dom";
import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import { IconCommentStroked } from "@consta/icons/IconCommentStroked";

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
    </Layout>
  );
};
