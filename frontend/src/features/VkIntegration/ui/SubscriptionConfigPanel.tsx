import { useMemo, useState } from "react";
import { Button } from "@consta/uikit/Button";
import { Badge } from "@consta/uikit/Badge";
import { IconSettings } from "@consta/icons/IconSettings";
import { useWorkspace } from "@shared/hooks/useWorkspace";
import { useRole } from "@shared/hooks/useRole";
import { AssistantWidget } from "@widgets/AssistantWidget";
import { vkUserSaveSubscriptions } from "@shared/api/vkUser";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import type { VkDialogItem, VkSubscriptionItem } from "@shared/api/vkUser";
import "./SubscriptionConfigPanel.css";

interface SubscriptionConfigPanelProps {
  accountId: string;
  dialog: VkDialogItem;
  subscription: VkSubscriptionItem | undefined;
}

export function SubscriptionConfigPanel({
  dialog,
  accountId,
  subscription,
}: SubscriptionConfigPanelProps) {
  const { workspaces } = useWorkspace();
  const { roles } = useRole();
  const queryClient = useQueryClient();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { workspace_id, role_id, enabled, mention_only } = subscription ?? {};
  const { peer_id, peer_type, title } = dialog;

  const workspaceName = useMemo(
    () => workspaces.find(w => w.id === workspace_id)?.name || null,
    [workspaces, workspace_id]
  );

  const roleName = useMemo(
    () => roles.find(r => r.id === role_id)?.name || null,
    [roles, role_id]
  );

  const canToggle = !!workspace_id && !!role_id;

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
      await vkUserSaveSubscriptions({
        account_id: accountId,
        items: [
          {
            peer_id,
            peer_type,
            title,
            enabled: config.enabled ?? enabled ?? false,
            workspace_id: config.workspace_id ?? workspace_id ?? null,
            role_id: config.role_id ?? role_id ?? null,
            mention_only:
              config.mention_only !== undefined
                ? config.mention_only
                : mention_only ?? null,
          },
        ],
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.vkUser.subscriptions(accountId),
      });

      onSuccess?.();
    } finally {
      setIsSavingSettings(false);
    }
  };

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
      { workspace_id: workspaceId, role_id: roleId, mention_only: mentionOnly },
      () => setIsWidgetOpen(false)
    );
  };

  const handleToggleEnabled = async () => {
    await saveSubscriptionConfig({ enabled: !(enabled ?? false) });
  };

  return (
    <>
      <div className="subscription-config-panel">
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
          <Button
            size="xs"
            view="ghost"
            onlyIcon
            iconLeft={IconSettings}
            label="Настройки"
            onClick={() => setIsWidgetOpen(true)}
            disabled={isSavingSettings}
          />

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

      {isWidgetOpen && (
        <AssistantWidget
          mode="overlay"
          isOpen={isWidgetOpen}
          onClose={() => setIsWidgetOpen(false)}
          containerSelector=".integrations-page__expanded"
          initialWorkspaceId={workspace_id}
          initialRoleId={role_id}
          initialMentionOnly={mention_only ?? true}
          title={`Настройки для ${title}`}
          onChange={handleSettingsChange}
        />
      )}
    </>
  );
}


