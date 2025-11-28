import { Button } from "@consta/uikit/Button";
import { Layout } from "@consta/uikit/Layout";
import { IconAdd } from "@consta/icons/IconAdd";
import {
  Select,
  type PropRenderValue,
  type PropRenderItem,
  type SelectPropOnChange,
} from "@consta/uikit/Select";
import { EditableField } from "@/shared/ui/EditableField";
import { EntityItem } from "./EntityItem";
import { useEntityCRUD } from "./useEntityCRUD";
import type { BaseEntity, EntityComboboxProps } from "./types";
import { Text } from "@consta/uikit/Text";
import { IconEdit } from "@consta/icons/IconEdit";

export function EntityCombobox<T extends BaseEntity>({
  label,
  mode = "switcher",
  value,
  onChange,
  currentItem,
  setCurrentItem,
  items,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,

  placeholder = "Выберите элемент",
  createPlaceholder = "Название",

  addButtonTitle = "Добавить",
  deleteConfirmMessage,
  renderItem: customRenderItem,
  renderExtraFields,
  renderActions,
  prepareCreateData,
  onAfterCreate,
  disabled = false,
}: EntityComboboxProps<T>) {
  // Логика выбора элемента в зависимости от режима
  const selectedItem = mode === "selector" ? (value ?? null) : currentItem;
  const handleSelect = (item: T | null) => {
    if (mode === "selector" && onChange) {
      onChange(item);
    } else {
      setCurrentItem(item);
    }
  };

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

  // Адаптер onChange для Consta Select
  const handleConstaChange: SelectPropOnChange<T> = item => {
    handleSelect(item);
  };

  // Рендер выбранного значения для Consta Select (просто отображение)
  const constaRenderValue: PropRenderValue<T> = ({ item }) => {
    return (
      <Text view="primary" size="xs" truncate style={{ flex: 1 }}>
        {item?.name || placeholder}
      </Text>
    );
  };

  // Рендер элемента в списке для Consta Select
  const constaRenderItem: PropRenderItem<T> = props => {
    const { item, onClick, onMouseEnter, ref } = props;
    const isEditing = editingId === item.id;
    const isDeleting =
      deleteMutation.isPending && deleteMutation.variables === item.id;

    // Если передан кастомный рендер, используем его
    if (customRenderItem) {
      return (
        <div ref={ref} onClick={onClick} onMouseEnter={onMouseEnter}>
          {customRenderItem({ item })}
        </div>
      );
    }

    // Иначе используем дефолтный EntityItem
    return (
      <div ref={ref} onClick={onClick} onMouseEnter={onMouseEnter}>
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
      </div>
    );
  };

  // Если в режиме создания
  if (isAdding) {
    return (
      <div>
        <Text size="xs" weight="semibold" view="secondary">
          {label}
        </Text>
        <EditableField
          inputRef={inputRef}
          value={tempName}
          onSave={saveNew}
          onCancel={cancelEdit}
          isLoading={createMutation.isPending}
          size="xs"
          placeholder={createPlaceholder}
        />
      </div>
    );
  }

  // Если в режиме редактирования
  if (editingId && selectedItem?.id === editingId) {
    return (
      <div>
        <Text size="xs" weight="semibold" view="secondary">
          {label}
        </Text>
        <EditableField
          inputRef={inputRef}
          value={tempName}
          onSave={name => saveEdit(editingId, name)}
          onCancel={cancelEdit}
          isLoading={updateMutation.isPending}
          size="xs"
          placeholder={placeholder}
        />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectProps: any = {
    items,
    value: selectedItem,
    onChange: handleConstaChange,
    getItemKey: (item: T) => item.id,
    getItemLabel: (item: T) => item.name,
    placeholder,
    size: "xs",
    renderValue: constaRenderValue,
    renderItem: constaRenderItem,
    disabled: disabled || isLoading,
  };

  return (
    <div>
      <Text size="xs" weight="semibold" view="secondary">
        {label}
      </Text>
      <Layout
        direction="row"
        style={{ gap: "var(--space-2xs)", alignItems: "center", width: "100%" }}
      >
        <Select {...selectProps} />

        {selectedItem && !disabled && (
          <Button
            size="xs"
            view="ghost"
            iconLeft={IconEdit}
            onClick={e => {
              e.stopPropagation();
              startEdit(selectedItem);
            }}
            title="Редактировать"
            onlyIcon
          />
        )}

        {!isAdding && !editingId && !disabled && (
          <Button
            size="xs"
            view="ghost"
            iconLeft={IconAdd}
            onClick={startAdding}
            title={addButtonTitle}
            onlyIcon
          />
        )}

        {renderActions && renderActions(selectedItem)}
      </Layout>

      {/* Дополнительные поля (например, промпт для роли) */}
      {renderExtraFields &&
        renderExtraFields({
          selectedItem,
          isAdding,
          onUpdate: handleSelect,
        })}
    </div>
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
