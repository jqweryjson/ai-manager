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
import type { DialogItem as DialogItemType } from "@shared/api/telegramUser";
import type { SubscriptionItem } from "@shared/api/telegramUser";

interface SubscriptionConfigPanelProps {
  account_id: string;
  dialog: DialogItemType;
  subscription: SubscriptionItem | undefined;
}

export function SubscriptionConfigPanel({
  dialog,
  account_id,
  subscription,
}: SubscriptionConfigPanelProps) {
  const { workspaces } = useWorkspace();
  const { roles } = useRole();
  const queryClient = useQueryClient();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { workspace_id, role_id, enabled, mention_only } = subscription ?? {};
  const { peer_id, peer_type, title, access_hash } = dialog;

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
      mention_only?: boolean;
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
            mention_only:
              config.mention_only !== undefined
                ? config.mention_only
                : mention_only,
            access_hash: access_hash ?? null,
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
    mentionOnly,
  }: {
    workspaceId: string | null;
    roleId: string | null;
    mentionOnly: boolean;
  }) => {
    await saveSubscriptionConfig(
      {
        workspace_id: workspaceId,
        role_id: roleId,
        mention_only: mentionOnly,
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
        <div
          className="subscription-config-panel__badges"
          onClick={() => setIsWidgetOpen(true)}
        >
          <Badge
            size="xs"
            label={workspaceName || "Workspace не выбран"}
            status={workspace_id ? "success" : "warning"}
            style={{ alignSelf: "flex-end" }}
          />
          <Badge
            size="xs"
            label={roleName || "Роль не выбрана"}
            status={role_id ? "success" : "warning"}
            style={{ alignSelf: "flex-end" }}
          />
        </div>

        <div className="subscription-config-panel__buttons">
          {/* Кнопка настроек */}
          <Button
            size="xs"
            view="ghost"
            onlyIcon
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
          initialMentionOnly={mention_only}
          title={`Настройки для ${title}`}
          onChange={handleSettingsChange}
        />
      )}
    </>
  );
}
