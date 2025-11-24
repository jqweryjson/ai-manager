import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import type { UseTelegramConnectionReturn } from "../hooks/useTelegramConnection";
import type { TelegramAccountStatus } from "../hooks/useTelegramUserStatus";
import { isConnected } from "../utils/statusUtils";

interface ConnectionFooterProps {
  status: TelegramAccountStatus;
  accountId?: string | null;
  connection: UseTelegramConnectionReturn;
}

export const ConnectionFooter = ({
  status,
  accountId,
  connection,
}: ConnectionFooterProps) => {
  const { loading, handleDisconnect } = connection;

  return (
    <Layout
      direction="row"
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-s)",
      }}
    >
      {isConnected(status) && accountId ? (
        <Button
          label="Отключить"
          view="secondary"
          size="s"
          onClick={handleDisconnect}
          disabled={loading}
        />
      ) : null}
    </Layout>
  );
};
