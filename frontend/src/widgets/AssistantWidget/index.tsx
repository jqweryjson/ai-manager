import { useState, useLayoutEffect } from "react";
import { Sidebar } from "@consta/uikit/Sidebar";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { IconArrowUndone } from "@consta/icons/IconArrowUndone";
import { WorkspaceCombobox } from "@/widgets/WorkspaceCombobox";
import { RoleCombobox } from "@/widgets/RoleCombobox";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import { useRole } from "@/shared/hooks/useRole";
import { useIsMobile } from "@/shared/hooks/useIsMobile";

import type { AssistantRole } from "@/shared/api/roles";
import type { AssistantWidgetProps } from "./types";
import type { Workspace } from "@/shared/context/WorkspaceContext";

import { ExtraSettings } from "./ExtraSettings";

import "./styles.css";

export const AssistantWidget = ({
  mode,
  isOpen = true,
  onClose,
  containerSelector,
  initialWorkspaceId = null,
  initialRoleId = null,
  title: widgetTitle = "Настройки Ассистента",
  initialMentionOnly = false,
  onChange,
  readOnly = false,
  showExtraSettings = true,
}: AssistantWidgetProps) => {
  const { workspaces } = useWorkspace();
  const { roles } = useRole();
  const { isMobile } = useIsMobile();

  // Локальное состояние для выбранных значений
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    workspaces.find(w => w.id === initialWorkspaceId) ?? null
  );

  const [selectedRole, setSelectedRole] = useState<AssistantRole | null>(
    roles.find(r => r.id === initialRoleId) ?? null
  );

  const [selectedMentionOnly, setSelectedMentionOnly] = useState<boolean>(
    Boolean(initialMentionOnly)
  );

  const [sidebarContainer, setSidebarContainer] =
    useState<HTMLDivElement | null>(null);

  const handleSave = () => {
    // Передаем выбранные значения наверх
    onChange?.({
      workspaceId: selectedWorkspace?.id || null,
      roleId: selectedRole?.id || null,
      mentionOnly: selectedMentionOnly,
    });
    onClose?.();
  };

  // Определяем контейнер для Sidebar
  useLayoutEffect(() => {
    if (containerSelector) {
      setSidebarContainer(
        document.querySelector(containerSelector) as HTMLDivElement | null
      );
    }
  }, [containerSelector]);

  const content = (
    <Layout direction="column" className="assistant-widget__content">
      {/* Header */}
      <div className="assistant-widget__header">
        <Text size="l" weight="bold" view="primary">
          {widgetTitle}
        </Text>
        {mode === "overlay" && (
          <Button
            size="xs"
            view="ghost"
            iconLeft={IconArrowUndone}
            onlyIcon
            onClick={onClose}
          />
        )}
      </div>

      {/* Body */}
      <Layout
        direction={isMobile ? "column" : "row"}
        className="assistant-widget__body-container"
      >
        <Layout className="assistant-widget__body">
          <WorkspaceCombobox
            mode="selector"
            value={selectedWorkspace}
            onChange={ws => {
              setSelectedWorkspace(ws || null);
            }}
            documentsContainerSelector={containerSelector}
            disabled={readOnly}
          />

          <RoleCombobox
            mode="selector"
            value={selectedRole}
            onChange={role => {
              setSelectedRole(role || null);
            }}
            disabled={readOnly}
          />

          {isMobile && showExtraSettings && (
            <ExtraSettings
              selectedMentionOnly={selectedMentionOnly}
              setSelectedMentionOnly={setSelectedMentionOnly}
            />
          )}
        </Layout>

        {!isMobile && showExtraSettings && (
          <ExtraSettings
            selectedMentionOnly={selectedMentionOnly}
            setSelectedMentionOnly={setSelectedMentionOnly}
          />
        )}
      </Layout>

      {/* Footer - показываем только если есть onChange callback */}
      {onChange && (
        <Button
          size="s"
          view="primary"
          label="Сохранить"
          disabled={!selectedWorkspace && !selectedRole}
          onClick={handleSave}
          style={{ alignSelf: "flex-end" }}
        />
      )}
    </Layout>
  );

  // Режим overlay - используем Sidebar
  if (mode === "overlay" && sidebarContainer) {
    return (
      <Sidebar
        isOpen={isOpen}
        // onClickOutside={onClose}
        onEsc={onClose}
        size="full"
        position="right"
        hasOverlay
        container={sidebarContainer}
        rootClassName="full-sidebar-custom"
      >
        {content}
      </Sidebar>
    );
  }

  // Режим permanent - просто возвращаем контент
  return (
    <div className="assistant-widget assistant-widget--permanent">
      {content}
    </div>
  );
};

export type { AssistantWidgetProps } from "./types";
