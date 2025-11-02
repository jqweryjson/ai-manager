import { Button } from "@consta/uikit/Button";
import { Layout } from "@consta/uikit/Layout";
import { IconAdd } from "@consta/icons/IconAdd";
import { Select } from "@/shared/ui/Select";
import { EditableField } from "@/shared/ui/EditableField";
import { ValueRenderer } from "@/shared/ui/ValueRenderer";
import { EntityItem } from "./EntityItem";
import { useEntityCRUD } from "./useEntityCRUD";
import { useEntitySelection } from "./useEntitySelection";
import type { BaseEntity, EntityComboboxProps } from "./types";

export function EntityCombobox<T extends BaseEntity>({
  mode = "switcher",
  value: externalValue,
  onChange: externalOnChange,
  currentItem,
  setCurrentItem,
  items,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,
  placeholder = "Выберите элемент",
  emptyPlaceholder = "Добавьте элемент",
  addButtonTitle = "Добавить",
  deleteConfirmMessage,
  createPlaceholder = "Название",
  renderItem: customRenderItem,
  renderExtraFields,
  prepareCreateData,
  onAfterCreate,
}: EntityComboboxProps<T>) {
  // Логика выбора элемента
  const { selectedItem, handleSelect } = useEntitySelection({
    mode,
    currentItem,
    setCurrentItem,
    externalValue,
    externalOnChange,
  });

  // CRUD операции
  const {
    editingId,
    isAdding,
    tempName,
    inputRef,
    startAdding,
    saveNew,
    startEdit,
    saveEdit,
    cancelEdit,
    handleDelete,
  } = useEntityCRUD({
    createMutation,
    updateMutation,
    deleteMutation,
    items,
    selectedItem,
    onSelect: handleSelect,
    prepareCreateData,
    onAfterCreate,
    deleteConfirmMessage,
  });

  // Рендер выбранного значения
  const renderValue = ({ value }: { value: T | null }) => {
    const isEditing = Boolean(editingId && value?.id === editingId);

    return (
      <ValueRenderer
        value={value}
        isEditing={isEditing}
        editingValue={tempName}
        onStartEdit={startEdit}
        onSaveEdit={name => value && saveEdit(value.id, name)}
        onCancelEdit={cancelEdit}
        isLoading={updateMutation.isPending}
        getDisplayValue={item => item.name}
        emptyPlaceholder={emptyPlaceholder}
        size="xs"
      />
    );
  };

  // Рендер элемента в списке
  const defaultRenderItem = ({ item }: { item: T }) => {
    const isEditing = editingId === item.id;
    const isDeleting =
      deleteMutation.isPending && deleteMutation.variables === item.id;

    return (
      <EntityItem
        item={item}
        isEditing={isEditing}
        tempName={tempName}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onDelete={handleDelete}
        isUpdating={updateMutation.isPending}
        isDeleting={isDeleting}
      />
    );
  };

  // Если в режиме создания
  if (isAdding) {
    return (
      <EditableField
        inputRef={inputRef}
        value={tempName}
        onSave={saveNew}
        onCancel={cancelEdit}
        isLoading={createMutation.isPending}
        size="xs"
        placeholder={createPlaceholder}
      />
    );
  }

  return (
    <Layout direction="column" style={{ gap: "var(--space-xs)" }}>
      <Layout
        direction="row"
        style={{ gap: "var(--space-2xs)", alignItems: "center", width: "100%" }}
      >
        <Select
          items={items}
          value={selectedItem || null}
          onChange={handleSelect}
          getItemKey={item => item.id}
          getItemLabel={item => item.name}
          placeholder={placeholder}
          size="s"
          renderValue={renderValue}
          renderItem={customRenderItem || defaultRenderItem}
          disabled={isLoading}
        />

        {!isAdding && !editingId && (
          <Button
            size="xs"
            view="ghost"
            iconLeft={IconAdd}
            onClick={startAdding}
            title={addButtonTitle}
            onlyIcon
          />
        )}
      </Layout>

      {/* Дополнительные поля (например, промпт для роли) */}
      {renderExtraFields &&
        renderExtraFields({
          selectedItem,
          isAdding,
          onUpdate: handleSelect,
        })}
    </Layout>
  );
}

export type {
  BaseEntity,
  CreateEntityParams,
  UpdateEntityParams,
  EntityComboboxProps,
  ItemHandlers,
  ExtraFieldsHandlers,
} from "./types";
