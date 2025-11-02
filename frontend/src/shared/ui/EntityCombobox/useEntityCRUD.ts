import { useState, useRef, useCallback } from "react";
import type { BaseEntity } from "./types";
import type { UseMutationResult } from "@tanstack/react-query";

interface UseEntityCRUDProps<T extends BaseEntity> {
  createMutation: UseMutationResult<T, Error, string>;
  updateMutation: UseMutationResult<T, Error, { id: string; name: string }>;
  deleteMutation: UseMutationResult<unknown, Error, string>;
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T | null) => void;
  prepareCreateData?: (name: string) => string;
  onAfterCreate?: (item: T) => void | Promise<void>;
  deleteConfirmMessage?: string;
}

export function useEntityCRUD<T extends BaseEntity>({
  createMutation,
  updateMutation,
  deleteMutation,
  items,
  selectedItem,
  onSelect,
  prepareCreateData,
  onAfterCreate,
  deleteConfirmMessage = "Удалить этот элемент?",
}: UseEntityCRUDProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Начать создание нового элемента
  const startAdding = useCallback(() => {
    setIsAdding(true);
    setTempName("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  // Сохранить новый элемент
  const saveNew = useCallback(
    async (name: string) => {
      try {
        const createData = prepareCreateData
          ? prepareCreateData(name.trim())
          : name.trim();

        const newItem = await createMutation.mutateAsync(createData);
        onSelect(newItem);
        setIsAdding(false);
        setTempName("");

        // Вызвать callback после создания (например, для генерации промпта)
        if (onAfterCreate) {
          await onAfterCreate(newItem);
        }
      } catch (error) {
        console.error("Ошибка создания элемента:", error);
      }
    },
    [createMutation, onSelect, prepareCreateData, onAfterCreate]
  );

  // Начать редактирование элемента
  const startEdit = useCallback((item: T) => {
    setEditingId(item.id);
    setTempName(item.name);
  }, []);

  // Сохранить изменения элемента
  const saveEdit = useCallback(
    async (id: string, name: string) => {
      if (!name.trim()) return;

      try {
        const updatedItem = await updateMutation.mutateAsync({
          id,
          name: name.trim(),
        });

        // Обновить выбранный элемент, если редактировали его
        if (selectedItem?.id === id) {
          onSelect(updatedItem);
        }

        setEditingId(null);
        setTempName("");
      } catch (error) {
        console.error("Ошибка обновления элемента:", error);
      }
    },
    [updateMutation, selectedItem, onSelect]
  );

  // Отменить редактирование/создание
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    setTempName("");
  }, []);

  // Удалить элемент
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(deleteConfirmMessage)) return;

      try {
        await deleteMutation.mutateAsync(id);

        // Если удаляемый элемент был выбран, выбрать следующий
        if (selectedItem?.id === id) {
          const remainingItems = items.filter(item => item.id !== id);
          if (remainingItems.length > 0) {
            onSelect(remainingItems[0]);
          } else {
            onSelect(null);
          }
        }
      } catch (error) {
        console.error("Ошибка удаления элемента:", error);
      }
    },
    [deleteMutation, selectedItem, items, onSelect, deleteConfirmMessage]
  );

  return {
    // Состояния
    editingId,
    isAdding,
    tempName,
    inputRef,

    // Обработчики
    startAdding,
    saveNew,
    startEdit,
    saveEdit,
    cancelEdit,
    handleDelete,
  };
}
