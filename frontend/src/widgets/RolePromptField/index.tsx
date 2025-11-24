import { useState, useEffect, useRef } from "react";
import { Button } from "@consta/uikit/Button";
import { TextField } from "@consta/uikit/TextField";
import { Text } from "@consta/uikit/Text";

import { debounce } from "lodash";
import {
  useUpdateRoleMutation,
  useGeneratePromptMutation,
} from "@/shared/hooks/useRoles";
import type { AssistantRole } from "@/shared/api/roles";
import { Layout } from "@consta/uikit/Layout";
import "./style.css";

interface RolePromptFieldProps {
  role: AssistantRole | null;
  onUpdate: (role: AssistantRole) => void;
  isCompact?: boolean;

  tempPrompt?: string;
  onTempPromptChange?: (prompt: string) => void;
}

export const RolePromptField = ({
  role,
  onUpdate,
  isCompact = true,
  tempPrompt = "",
  onTempPromptChange,
}: RolePromptFieldProps) => {
  const updateMutation = useUpdateRoleMutation();
  const generatePromptMutation = useGeneratePromptMutation();

  // При создании новой роли TextArea видна сразу
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Создаем debounced функцию через useRef (как в статье Carl Rippon)
  const debouncedSavePrompt = useRef(
    debounce(async (roleId: string, prompt: string) => {
      setIsSavingPrompt(true);
      try {
        await updateMutation.mutateAsync({
          id: roleId,
          data: { prompt: prompt.trim() },
        });
        setLastSavedAt(new Date());
      } catch (error) {
        console.error("Ошибка сохранения промпта:", error);
      } finally {
        setIsSavingPrompt(false);
      }
    }, 1000)
  ).current;

  // Очистка debounced функции при размонтировании
  useEffect(() => {
    return () => {
      debouncedSavePrompt.cancel();
    };
  }, [debouncedSavePrompt]);

  // Генерация промпта
  const generatePrompt = async () => {
    if (!role?.name?.trim()) return;

    setIsGeneratingPrompt(true);
    try {
      const generatedPrompt = await generatePromptMutation.mutateAsync(
        role.name.trim()
      );

      const updatedRole = {
        ...role,
        prompt: generatedPrompt,
      };
      onUpdate(updatedRole);

      // Сохраняем на сервере
      await updateMutation.mutateAsync({
        id: role.id,
        data: { prompt: generatedPrompt },
      });
      setLastSavedAt(new Date());
    } catch (error) {
      console.error("Ошибка генерации промпта:", error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Обработчик изменения промпта
  const handlePromptChange = (value: string | null) => {
    const promptValue = value || "";

    if (role) {
      const updatedRole = {
        ...role,
        prompt: promptValue,
      };
      onUpdate(updatedRole);

      // Автоматически сохраняем промпт с дебаунсом
      if (promptValue.trim()) {
        debouncedSavePrompt(role.id, promptValue);
      }
    } else if (onTempPromptChange) {
      onTempPromptChange(promptValue);
    }
  };

  const currentPrompt = role?.prompt || tempPrompt || "";

  // TextArea видна - показываем полный интерфейс
  return (
    <div className="role-prompt-field">
      <Layout
        style={{
          alignItems: "center",
          gap: "var(--space-xs)",
          marginTop: "var(--space-xs)",
          marginBottom: isCompact ? "var(--space-xs)" : "var(--space-m)",
        }}
      >
        <TextField
          type="textarea"
          withClearButton
          value={currentPrompt}
          onChange={handlePromptChange}
          placeholder="Промпт роли ассистента..."
          rows={isCompact ? 15 : undefined}
          size="xs"
          style={{
            flex: 1,
          }}
        />

        <Layout
          direction="column"
          style={{
            gap: "var(--space-2xs)",
            alignSelf: "flex-start",
          }}
        >
          <Button
            size="xs"
            view="ghost"
            onClick={generatePrompt}
            loading={isGeneratingPrompt}
            disabled={!role?.name}
            title="Сгенерировать промпт"
            onlyIcon
            iconLeft={() => "✨"}
          />
        </Layout>
      </Layout>

      {/* Статусы */}
      <div
        style={{ display: "flex", gap: "var(--space-s)", alignItems: "center" }}
      >
        {isGeneratingPrompt && (
          <Text size="xs" view="secondary">
            Генерируем промпт...
          </Text>
        )}
        {isSavingPrompt && (
          <Text size="xs" view="secondary">
            Сохраняем промпт...
          </Text>
        )}
        {lastSavedAt && !isSavingPrompt && !isGeneratingPrompt && (
          <Text size="xs" view="secondary">
            Сохранено {lastSavedAt.toLocaleTimeString()}
          </Text>
        )}
      </div>
    </div>
  );
};
