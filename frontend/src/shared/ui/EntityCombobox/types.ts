import type { ReactNode } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

/**
 * Базовый тип для сущностей, которые могут быть использованы в EntityCombobox
 */
export interface BaseEntity {
  id: string;
  name: string;
}

/**
 * Параметры для создания сущности
 */
export interface CreateEntityParams {
  name: string;
  [key: string]: unknown;
}

/**
 * Параметры для обновления сущности
 */
export interface UpdateEntityParams {
  id: string;
  data: {
    name?: string;
    [key: string]: unknown;
  };
}

/**
 * Обработчики для работы с элементом в списке
 */
export interface ItemHandlers<T extends BaseEntity> {
  onStartEdit: (item: T) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  isDeleting: boolean;
}

/**
 * Обработчики для дополнительных полей
 */
export interface ExtraFieldsHandlers<T extends BaseEntity> {
  selectedItem: T | null;
  isAdding: boolean;
  onUpdate: (item: T) => void;
}

/**
 * Пропсы для EntityCombobox
 */
export interface EntityComboboxProps<T extends BaseEntity> {
  label?: string;
  // Режим работы
  mode?: "switcher" | "selector";

  // Внешние значения (для режима selector)
  value?: T | null;
  onChange?: (item: T | null) => void;

  // Данные из контекста (для режима switcher)
  currentItem: T | null;
  setCurrentItem: (item: T | null) => void;
  items: T[];
  isLoading: boolean;

  // CRUD мутации
  createMutation: UseMutationResult<T, Error, string>;
  updateMutation: UseMutationResult<T, Error, { id: string; name: string }>;
  deleteMutation: UseMutationResult<unknown, Error, string>;

  // UI настройки
  placeholder?: string;
  emptyPlaceholder?: string;
  addButtonTitle?: string;
  deleteConfirmMessage?: string;
  createPlaceholder?: string;

  // Кастомизация рендеринга
  renderItem?: (args: { item: T }) => ReactNode;
  renderExtraFields?: (handlers: ExtraFieldsHandlers<T>) => ReactNode;

  // Обработка создания
  prepareCreateData?: (name: string) => string;
  onAfterCreate?: (item: T) => void | Promise<void>;
}
