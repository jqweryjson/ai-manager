import { useState, useLayoutEffect } from "react";
import { Sidebar } from "@consta/uikit/Sidebar";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { IconClose } from "@consta/icons/IconClose";
import { DocumentManagementPanel } from "@/features/Documents";
import { WorkspaceCombobox } from "@/widgets/WorkspaceCombobox";
import { RoleCombobox } from "@/widgets/RoleCombobox";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import { useRole } from "@/shared/hooks/useRole";
import type { AssistantWidgetProps } from "./types";
import "./styles.css";
import type { Workspace } from "@/shared/context/WorkspaceContext";
import type { AssistantRole } from "@/shared/api/roles";

export const AssistantWidget = ({
  mode,
  isOpen = true,
  onClose,
  containerSelector,
  initialWorkspaceId = null,
  initialRoleId = null,
  title: widgetTitle = "Настройки Ассистента",
  showDocuments = true,
  onChange,
}: AssistantWidgetProps) => {
  const { workspaces } = useWorkspace();
  const { roles } = useRole();

  // Локальное состояние для выбранных значений
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    workspaces.find(w => w.id === initialWorkspaceId) ?? null
  );

  const [selectedRole, setSelectedRole] = useState<AssistantRole | null>(
    roles.find(r => r.id === initialRoleId) ?? null
  );

  const [sidebarContainer, setSidebarContainer] =
    useState<HTMLDivElement | null>(null);

  // Определяем контейнер для Sidebar
  useLayoutEffect(() => {
    if (containerSelector) {
      setSidebarContainer(
        document.querySelector(containerSelector) as HTMLDivElement | null
      );
    }
  }, [containerSelector]);

  const handleSave = () => {
    // Передаем выбранные значения наверх
    onChange?.({
      workspaceId: selectedWorkspace?.id || null,
      roleId: selectedRole?.id || null,
    });
    onClose?.();
  };

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
            iconLeft={IconClose}
            onlyIcon
            onClick={onClose}
          />
        )}
      </div>

      {/* Body */}
      <div className="assistant-widget__body">
        {showDocuments && <DocumentManagementPanel />}

        <WorkspaceCombobox
          mode="selector"
          value={selectedWorkspace}
          onChange={ws => {
            setSelectedWorkspace(ws || null);
          }}
        />

        <RoleCombobox
          mode="selector"
          value={selectedRole}
          onChange={role => {
            setSelectedRole(role || null);
          }}
        />
      </div>

      {/* Footer - показываем только если есть onChange callback */}
      {onChange && (
        <div className="assistant-widget__footer">
          <Button
            size="m"
            view="primary"
            label="Сохранить"
            disabled={!selectedWorkspace && !selectedRole}
            onClick={handleSave}
          />
        </div>
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
        rootClassName="assistant-widget"
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
