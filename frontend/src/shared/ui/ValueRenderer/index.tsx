import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { IconEdit } from "@consta/icons/IconEdit";
import { EditableField } from "@/shared/ui/EditableField";

interface ValueRendererProps<T> {
  value: T | null;
  isEditing: boolean;
  editingValue: string;
  onStartEdit: (value: T) => void;
  onSaveEdit: (newValue: string) => void;
  onCancelEdit: () => void;
  isLoading: boolean;
  getDisplayValue: (value: T) => string;
  placeholder?: string;
  size?: "xs" | "s";
  mode?: "switcher" | "selector";
  className?: string;
}

export function ValueRenderer<T>({
  value,
  isEditing,
  editingValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  isLoading,
  getDisplayValue,
  placeholder = "Выберите значение",
  size = "s",
  mode = "switcher",
  className,
}: ValueRendererProps<T>) {
  // В режиме selector только текст без редактирования
  if (mode === "selector") {
    return (
      <Text view="secondary" size={size}>
        {value ? getDisplayValue(value) : placeholder}
      </Text>
    );
  }

  // В режиме редактирования
  if (isEditing) {
    return (
      <div className={className}>
        <EditableField
          value={editingValue}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isLoading={isLoading}
          size={size}
          placeholder={placeholder}
        />
      </div>
    );
  }

  // В режиме просмотра
  return (
    <Layout
      className={className}
      tabIndex={0}
      style={{
        gap: "var(--space-2xs)",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      {!value ? (
        <Text view="ghost" size={size}>
          {placeholder}
        </Text>
      ) : (
        <>
          <TextField value={getDisplayValue(value)} size={size} readOnly />
          <Button
            size={size}
            view="ghost"
            iconLeft={IconEdit}
            onClick={e => {
              e.stopPropagation();
              if (value) onStartEdit(value);
            }}
          />
        </>
      )}
    </Layout>
  );
}
