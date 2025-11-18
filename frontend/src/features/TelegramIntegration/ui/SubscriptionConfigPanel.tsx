import { useMemo, useState } from "react";
import { Button } from "@consta/uikit/Button";
import { Badge } from "@consta/uikit/Badge";
import { IconSettings } from "@consta/icons/IconSettings";
import { useWorkspace } from "@shared/hooks/useWorkspace";
import { useRole } from "@shared/hooks/useRole";
import { AssistantWidget } from "@widgets/AssistantWidget";
import { saveSubscriptions } from "@shared/api/telegramUser";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import "./SubscriptionConfigPanel.css";

interface SubscriptionConfigPanelProps {
  peer_id: string;
  peer_type: "user" | "chat" | "channel";
  title: string;
  account_id: string;
  workspace_id: string | null;
  role_id: string | null;
  enabled: boolean;
}

export function SubscriptionConfigPanel({
  peer_id,
  peer_type,
  title,
  account_id,
  workspace_id,
  role_id,
  enabled,
}: SubscriptionConfigPanelProps) {
  const { workspaces } = useWorkspace();
  const { roles } = useRole();
  const queryClient = useQueryClient();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Находим названия workspace и role по ID
  const workspaceName = useMemo(
    () => workspaces.find(w => w.id === workspace_id)?.name || null,
    [workspaces, workspace_id]
  );

  const roleName = useMemo(
    () => roles.find(r => r.id === role_id)?.name || null,
    [roles, role_id]
  );

  const canToggle = !!workspace_id && !!role_id;

  // Общая функция для сохранения подписки
  const saveSubscriptionConfig = async (
    config: {
      enabled?: boolean;
      workspace_id?: string | null;
      role_id?: string | null;
    },
    onSuccess?: () => void
  ) => {
    setIsSavingSettings(true);
    try {
      await saveSubscriptions({
        account_id,
        items: [
          {
            peer_id,
            peer_type,
            title,
            enabled: config.enabled ?? enabled,
            workspace_id: config.workspace_id ?? workspace_id,
            role_id: config.role_id ?? role_id,
          },
        ],
      });

      // Инвалидируем кеш для обновления UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.telegramUser.subscriptions(account_id),
      });

      // Выполняем дополнительные действия после успешного сохранения
      onSuccess?.();
    } catch (error) {
      console.error("Ошибка сохранения подписки:", error);
      throw error; // Пробрасываем ошибку для обработки в вызывающем коде
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Обработка сохранения настроек из виджета
  const handleSettingsChange = async ({
    workspaceId,
    roleId,
  }: {
    workspaceId: string | null;
    roleId: string | null;
  }) => {
    await saveSubscriptionConfig(
      {
        workspace_id: workspaceId,
        role_id: roleId,
      },
      () => {
        setIsWidgetOpen(false);
      }
    );
  };

  // Обработка переключения enabled
  const handleToggleEnabled = async () => {
    await saveSubscriptionConfig({
      enabled: !enabled,
    });
  };

  return (
    <>
      <div className="subscription-config-panel">
        {/* Badges с workspace и role */}
        <div className="subscription-config-panel__badges">
          <Badge
            size="xs"
            label={workspaceName || "Workspace не выбран"}
            status={workspace_id ? "success" : "warning"}
          />
          <Badge
            size="xs"
            label={roleName || "Роль не выбрана"}
            status={role_id ? "success" : "warning"}
          />
        </div>

        {/* Кнопка настроек */}
        <Button
          size="xs"
          view="ghost"
          iconLeft={IconSettings}
          label="Настройки"
          onClick={() => setIsWidgetOpen(true)}
          disabled={isSavingSettings}
        />

        {/* Кнопка включить/отключить */}
        <Button
          view={enabled ? "ghost" : "primary"}
          size="xs"
          onClick={handleToggleEnabled}
          disabled={isSavingSettings || !canToggle}
          label={
            isSavingSettings
              ? "Сохранение..."
              : enabled
                ? "Отключить автоответы"
                : "Включить автоответы"
          }
        />
      </div>

      {/* Виджет настроек */}
      {isWidgetOpen && (
        <AssistantWidget
          mode="overlay"
          isOpen={isWidgetOpen}
          onClose={() => setIsWidgetOpen(false)}
          containerSelector=".integrations-page__expanded"
          initialWorkspaceId={workspace_id}
          initialRoleId={role_id}
          title={`Настройки для ${title}`}
          showDocuments={false}
          onChange={handleSettingsChange}
        />
      )}
    </>
  );
}
