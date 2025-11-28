import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import { IconEdit } from "@consta/icons/IconEdit";
import { IconTrash } from "@consta/icons/IconTrash";
import { EditableField } from "@/shared/ui/EditableField";
import type { BaseEntity } from "./types";

interface EntityItemProps<T extends BaseEntity> {
  item: T;
  isEditing: boolean;
  tempName: string;
  onStartEdit: (item: T) => void;
  onSaveEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function EntityItem<T extends BaseEntity>({
  item,
  isEditing,
  tempName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: EntityItemProps<T>) {
  if (isEditing) {
    return (
      <div style={{ padding: "var(--space-xs)" }}>
        <EditableField
          value={tempName}
          onSave={name => onSaveEdit(item.id, name)}
          onCancel={onCancelEdit}
          isLoading={isUpdating}
          size="xs"
        />
      </div>
    );
  }

  return (
    <Layout
      style={{
        alignItems: "center",
        padding: "var(--space-xs)",
        gap: "var(--space-xs)",
      }}
    >
      <Text view="primary" size="xs" truncate style={{ flex: 1 }}>
        {item.name}
      </Text>

      <Button
        size="xs"
        view="ghost"
        iconLeft={IconEdit}
        onClick={e => {
          e.stopPropagation();
          onStartEdit(item);
        }}
      />
      <Button
        size="xs"
        view="ghost"
        iconLeft={IconTrash}
        onClick={e => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        loading={isDeleting}
      />
    </Layout>
  );
}
