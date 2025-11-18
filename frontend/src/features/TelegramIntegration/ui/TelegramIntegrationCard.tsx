import { useEffect } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { IconSendMessage } from "@consta/icons/IconSendMessage";
import type { TelegramIntegrationCardProps } from "../types";
import { ExpandableCard } from "@shared/ui/ExpandableCard";
import { useTelegramUserStatus } from "../hooks/useTelegramUserStatus";
import { useTelegramConnection } from "../hooks/useTelegramConnection";
import { getStatusLabel, isPreparing, isConnected } from "../utils/statusUtils";
import "./TelegramIntegrationCard.css";
import { IntegrationCardHeader } from "@shared/ui/IntegrationCardHeader";
import { TelegramDialogsList } from "./TelegramDialogsList";
import { ConnectionInstructions } from "./ConnectionInstructions";
import { ConnectionForm } from "./ConnectionForm";
import { ConnectionFooter } from "./ConnectionFooter";

const noop = () => undefined;

export const TelegramIntegrationCard = ({
  isExpanded = false,
  onExpand = noop,
  onCollapse = noop,
}: TelegramIntegrationCardProps) => {
  // Используем хук для получения статуса - загружается независимо от isExpanded
  const {
    status: currentStatus,
    accountId,
    userPhone,
    requires2FA: requires2FAFromStatus,
  } = useTelegramUserStatus();

  // Хук для управления подключением
  const connection = useTelegramConnection({ accountId });

  // Синхронизируем локальное состояние 2FA со статусом
  useEffect(() => {
    if (requires2FAFromStatus) {
      connection.setRequires2FA(true);
    }
  }, [requires2FAFromStatus, connection]);

  const statusLabel = getStatusLabel(currentStatus);

  const header = (
    <IntegrationCardHeader
      icon={
        <IconSendMessage size="m" style={{ transform: "rotate(-40deg)" }} />
      }
      title="Telegram"
      subtitle={`Автоматические ответы в группах и личных сообщениях. ${userPhone || ""}`}
      statusLabel={statusLabel}
    />
  );

  return (
    <ExpandableCard
      className="telegram-integration-card"
      isExpanded={isExpanded}
      onExpand={onExpand}
      onCollapse={onCollapse}
      header={header}
      closeButtonAriaLabel="Свернуть карточку Telegram"
      contentClassName="telegram-integration-card__body"
    >
      <Layout direction="column" style={{ gap: "var(--space-m)", flex: 1 }}>
        <Text size="s" view="primary">
          {isPreparing(currentStatus)
            ? "Настроим подключение бота, вебхуки и сценарии ответов. Здесь появится управление токеном и выбором workspace."
            : isConnected(currentStatus)
              ? "Интеграция активна. Подключайте чаты для автоматических ответов."
              : "Подключите свой Telegram аккаунт для автоматических ответов."}
        </Text>

        {isPreparing(currentStatus) && <ConnectionInstructions />}

        {!isConnected(currentStatus) && (
          <ConnectionForm accountId={accountId} connection={connection} />
        )}

        {isConnected(currentStatus) && accountId && (
          <TelegramDialogsList accountId={accountId} />
        )}

        <ConnectionFooter
          status={currentStatus}
          accountId={accountId}
          connection={connection}
        />
      </Layout>
    </ExpandableCard>
  );
};
