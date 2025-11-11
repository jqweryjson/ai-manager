import { useMemo } from "react";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/shared/hooks/useWorkspaces";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import type { Workspace } from "@/shared/context/WorkspaceContext";
import { EntityCombobox } from "@/shared/ui/EntityCombobox";
import "./styles.css";

interface WorkspaceComboboxProps {
  mode: "switcher" | "selector";
  value?: Workspace | null;
  onChange?: (workspace: Workspace | null) => void;
}

export const WorkspaceCombobox = ({
  mode,
  value,
  onChange,
}: WorkspaceComboboxProps) => {
  const { currentWorkspace, setCurrentWorkspace, workspaces, isLoading } =
    useWorkspace();
  const createMutation = useCreateWorkspaceMutation();
  const updateMutation = useUpdateWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();

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

  return (
    <EntityCombobox
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
      label="Рабочая область"
      placeholder="Выберите workspace"
      emptyPlaceholder="Добавьте рабочую область"
      addButtonTitle="Добавить workspace"
      deleteConfirmMessage="Удалить этот workspace?"
      createPlaceholder="Название workspace"
      prepareCreateData={name => name}
    />
  );
};
