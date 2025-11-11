import { useState, useMemo } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "@/shared/hooks/useRoles";
import { useRole } from "@/shared/hooks/useRole";
import type { AssistantRole } from "@/shared/api/roles";
import { EntityCombobox } from "@/shared/ui/EntityCombobox";
import type { ExtraFieldsHandlers } from "@/shared/ui/EntityCombobox";
import { RolePromptField } from "../RolePromptField";
import "./styles.css";

interface RoleComboboxProps {
  mode?: "switcher" | "selector";
  value?: AssistantRole | null;
  onChange?: (role: AssistantRole | null) => void;
  onOpenEditor?: (role: AssistantRole) => void;
}

export const RoleCombobox = ({
  mode = "switcher",
  value,
  onChange,
  onOpenEditor,
}: RoleComboboxProps) => {
  const { currentRole, setCurrentRole, roles, isLoading } = useRole();
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const deleteMutation = useDeleteRoleMutation();

  const [tempPrompt, setTempPrompt] = useState("");

  // Обертка для createMutation чтобы адаптировать к формату EntityCombobox
  const wrappedCreateMutation: UseMutationResult<AssistantRole, Error, string> =
    useMemo(() => {
      const base = createMutation as unknown as UseMutationResult<
        AssistantRole,
        Error,
        string
      >;
      return {
        ...base,
        mutateAsync: async (name: string) =>
          createMutation.mutateAsync({ name, prompt: tempPrompt }),
      } as UseMutationResult<AssistantRole, Error, string>;
    }, [createMutation, tempPrompt]);

  // Обертка для updateMutation чтобы адаптировать к формату EntityCombobox
  const wrappedUpdateMutation: UseMutationResult<
    AssistantRole,
    Error,
    { id: string; name: string }
  > = useMemo(() => {
    const base = updateMutation as unknown as UseMutationResult<
      AssistantRole,
      Error,
      { id: string; name: string }
    >;
    return {
      ...base,
      mutateAsync: async (params: { id: string; name: string }) =>
        updateMutation.mutateAsync({
          id: params.id,
          data: { name: params.name },
        }),
    } as UseMutationResult<AssistantRole, Error, { id: string; name: string }>;
  }, [updateMutation]);

  // Callback после создания роли - автогенерация промпта будет происходить в RolePromptField
  const handleAfterCreate = async () => {
    // Логика автогенерации перенесена в RolePromptField
  };

  // Рендер дополнительного поля промпта
  const renderPromptField = ({
    selectedItem,
    isAdding,
    onUpdate,
  }: ExtraFieldsHandlers<AssistantRole>) => {
    if (!selectedItem && !isAdding) return null;

    return (
      <RolePromptField
        role={selectedItem}
        onUpdate={onUpdate}
        isCompact={true}
        onExpand={selectedItem ? () => onOpenEditor?.(selectedItem) : undefined}
        tempPrompt={tempPrompt}
        onTempPromptChange={setTempPrompt}
      />
    );
  };

  return (
    <EntityCombobox<AssistantRole>
      mode={mode}
      value={value}
      onChange={onChange}
      currentItem={currentRole}
      setCurrentItem={setCurrentRole}
      items={roles}
      isLoading={isLoading}
      createMutation={wrappedCreateMutation}
      updateMutation={wrappedUpdateMutation}
      deleteMutation={deleteMutation}
      placeholder="Выберите роль ассистента"
      emptyPlaceholder="Добавьте роль"
      addButtonTitle="Добавить роль"
      deleteConfirmMessage="Удалить эту роль?"
      createPlaceholder="Название роли"
      prepareCreateData={name => name}
      onAfterCreate={handleAfterCreate}
      renderExtraFields={renderPromptField}
    />
  );
};
