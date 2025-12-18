import { useEffect } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { IconLink } from "@consta/icons/IconLink";
import { IconClose } from "@consta/icons/IconClose";
import { ExpandableCard } from "@shared/ui/ExpandableCard";
import { IntegrationCardHeader } from "@shared/ui/IntegrationCardHeader";
import type { VkIntegrationCardProps } from "../types";
import { useVkUserStatus } from "../hooks/useVkUserStatus";
import { getStatusLabel, isConnected } from "../utils/statusUtils";
import { vkUserStartConnection, vkUserDisconnect } from "@shared/api/vkUser";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import { useSearchParams } from "react-router-dom";
import { VkDialogsList } from "./VkDialogsList";
import "./VkIntegrationCard.css";

export const VkIntegrationCard = ({ isExpanded, onExpand }: VkIntegrationCardProps) => {
  const { status, accountId, vkUserId, isLoading, refetch } = useVkUserStatus();
  const statusLabel = getStatusLabel(status);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // после OAuth callback VK редиректит на /app/integrations?success=vk_connected...
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "vk_connected") {
      queryClient.invalidateQueries({ queryKey: queryKeys.vkUser.status });
      void refetch();
    }
  }, [queryClient, refetch, searchParams]);

  const header = (
    <IntegrationCardHeader
      icon={<IconLink size="m" />}
      title="VK"
      subtitle={`Автоответы в чатах и сообществах. ${vkUserId ? `VK ID: ${vkUserId}` : ""}`}
      statusLabel={statusLabel}
    />
  );

  const handleConnect = async () => {
    const res = await vkUserStartConnection();
    window.location.href = res.oauth_url;
  };

  const handleDisconnect = async () => {
    if (!accountId) return;
    await vkUserDisconnect(accountId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.vkUser.status });
  };

  return (
    <ExpandableCard
      className="vk-integration-card"
      isExpanded={isExpanded}
      onExpand={onExpand}
      header={header}
      closeButtonAriaLabel="Свернуть карточку VK"
      contentClassName="vk-integration-card__body"
    >
      <Layout direction="column" style={{ gap: "var(--space-m)", flex: 1 }}>
        <Text size="s" view="primary" className="hidden-mobile">
          {isConnected(status)
            ? "Интеграция активна. Выберите диалоги и включите автоответы."
            : "Подключите VK аккаунт для автоответов (OAuth messages/offline)."}
        </Text>

        {!isConnected(status) ? (
          <Layout direction="row" style={{ gap: "var(--space-s)", alignItems: "center" }}>
            <Button
              size="s"
              view="primary"
              label={isLoading ? "Загрузка..." : "Подключить VK"}
              onClick={handleConnect}
              disabled={isLoading}
            />
            <Text size="xs" view="secondary">
              Вы будете перенаправлены в VK для выдачи прав.
            </Text>
          </Layout>
        ) : accountId ? (
          <VkDialogsList accountId={accountId} />
        ) : null}

        {isConnected(status) && accountId ? (
          <Layout direction="row" style={{ gap: "var(--space-s)" }}>
            <Button
              size="xs"
              view="ghost"
              label="Отключить"
              iconLeft={IconClose}
              onClick={handleDisconnect}
            />
          </Layout>
        ) : null}
      </Layout>
    </ExpandableCard>
  );
};


