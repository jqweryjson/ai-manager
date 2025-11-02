import { useState, useEffect, useCallback } from "react";
import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import { Layout } from "@consta/uikit/Layout";
import { RolePromptField } from "../RolePromptField";
import type { AssistantRole } from "@/shared/api/roles";

interface RolePromptEditorProps {
  role: AssistantRole;
  onSave: (prompt: string) => Promise<void>;
  onClose: () => void;
}

export const RolePromptEditor = ({
  role,
  onSave,
  onClose,
}: RolePromptEditorProps) => {
  const [localPrompt, setLocalPrompt] = useState(role.prompt || "");

  // Обработчик обновления роли (для автосохранения)
  const handleRoleUpdate = useCallback((updatedRole: AssistantRole) => {
    setLocalPrompt(updatedRole.prompt || "");
  }, []);

  // Обработчик изменения промпта
  const handlePromptChange = useCallback((prompt: string) => {
    setLocalPrompt(prompt);
  }, []);

  // Сохранение
  const handleSave = useCallback(async () => {
    try {
      await onSave(localPrompt);
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  }, [localPrompt, onSave]);

  // Закрытие с проверкой несохраненных изменений
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, handleSave]);

  return (
    <Layout
      direction="column"
      style={{
        height: "100%",
        overflow: "hidden",
        background: "var(--color-bg-default)",
        width: "100%",
      }}
    >
      {/* Заголовок */}
      <Layout
        style={{
          padding: "var(--space-m)",
          borderBottom: "1px solid var(--color-bg-border)",
          background: "var(--color-bg-secondary)",
          justifyContent: "space-between",
        }}
      >
        <Text size="l" weight="semibold" view="primary">
          Редактирование роли: {role.name}
        </Text>
        <Button
          view="secondary"
          size="s"
          onClick={handleClose}
          label="Закрыть"
        />
      </Layout>

      {/* Основной контент */}
      <Layout
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-m)",
        }}
      >
        <RolePromptField
          role={{ ...role, prompt: localPrompt }}
          onUpdate={handleRoleUpdate}
          isCompact={false}
          tempPrompt={localPrompt}
          onTempPromptChange={handlePromptChange}
        />
      </Layout>
    </Layout>
  );
};
