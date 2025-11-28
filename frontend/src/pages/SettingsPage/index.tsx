import { Layout } from "@consta/uikit/Layout";
import { AssistantWidget } from "@/widgets/AssistantWidget";
import "./styles.css";

export const SettingsPage = () => {
  return (
    <Layout direction="column" className="settings-page">
      <AssistantWidget mode="permanent" containerSelector=".settings-page" />
    </Layout>
  );
};
