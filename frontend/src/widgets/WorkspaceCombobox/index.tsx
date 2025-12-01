import { useMemo, useState } from "react";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/shared/hooks/useWorkspaces";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import type { Workspace } from "@/shared/context/WorkspaceContext";
import { EntityCombobox } from "@/shared/ui/EntityCombobox";
import "./styles.css";
import { Button } from "@consta/uikit/Button";
import { IconLayers } from "@consta/icons/IconLayers";
import { DocumentManagementSidebar } from "@/features/Documents";

interface WorkspaceComboboxProps {
  mode: "switcher" | "selector";
  value?: Workspace | null;
  onChange?: (workspace: Workspace | null) => void;
  documentsContainerSelector?: string;
  enableDocumentsAction?: boolean;
  disabled?: boolean;
}

export const WorkspaceCombobox = ({
  mode,
  value,
  onChange,
  documentsContainerSelector,
  enableDocumentsAction = true,
  disabled = false,
}: WorkspaceComboboxProps) => {
  const { currentWorkspace, setCurrentWorkspace, workspaces, isLoading } =
    useWorkspace();
  const createMutation = useCreateWorkspaceMutation();
  const updateMutation = useUpdateWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();
  const [isDocumentsSidebarOpen, setDocumentsSidebarOpen] = useState(false);
  const [documentsWorkspaceId, setDocumentsWorkspaceId] = useState<
    string | null
  >(null);

  // Обертка для updateMutation чтобы адаптировать к формату EntityCombobox
  const wrappedUpdateMutation = useMemo(
    () => ({
      ...updateMutation,
      mutateAsync: async (params: { id: string; name: string }) => {
        return updateMutation.mutateAsync({
          id: params.id,
          name: params.name,
        });
      },
    }),
    [updateMutation]
  );

  const activeWorkspace = value ?? currentWorkspace ?? null;

  const handleOpenDocumentsSidebar = (workspace: Workspace | null) => {
    const targetId = workspace?.id || activeWorkspace?.id || null;
    if (!targetId) {
      return;
    }
    setDocumentsWorkspaceId(targetId);
    setDocumentsSidebarOpen(true);
  };

  return (
    <>
      <EntityCombobox
        label="Рабочая область"
        mode={mode}
        value={value}
        onChange={onChange}
        currentItem={currentWorkspace}
        setCurrentItem={setCurrentWorkspace}
        items={workspaces}
        isLoading={isLoading}
        createMutation={createMutation}
        updateMutation={wrappedUpdateMutation}
        deleteMutation={deleteMutation}
        placeholder="Выберите workspace"
        addButtonTitle="Добавить workspace"
        deleteConfirmMessage="Удалить этот workspace?"
        createPlaceholder="Название workspace"
        prepareCreateData={name => name}
        disabled={disabled}
        renderActions={
          enableDocumentsAction && !disabled
            ? selected => (
                <Button
                  size="xs"
                  view="ghost"
                  iconLeft={IconLayers}
                  label="База знаний"
                  onClick={() => handleOpenDocumentsSidebar(selected)}
                  disabled={!selected && !activeWorkspace}
                />
              )
            : undefined
        }
      />

      {enableDocumentsAction && (
        <DocumentManagementSidebar
          isOpen={isDocumentsSidebarOpen}
          onClose={() => setDocumentsSidebarOpen(false)}
          containerSelector={documentsContainerSelector}
          initialWorkspaceId={
            documentsWorkspaceId || activeWorkspace?.id || undefined
          }
        />
      )}
    </>
  );
};
