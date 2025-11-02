import { useCallback } from "react";
import type { BaseEntity } from "./types";

interface UseEntitySelectionProps<T extends BaseEntity> {
  mode: "switcher" | "selector";
  currentItem: T | null;
  setCurrentItem: (item: T | null) => void;
  externalValue?: T | null;
  externalOnChange?: (item: T | null) => void;
}

export function useEntitySelection<T extends BaseEntity>({
  mode,
  currentItem,
  setCurrentItem,
  externalValue,
  externalOnChange,
}: UseEntitySelectionProps<T>) {
  // Определить выбранный элемент в зависимости от режима
  const selectedItem =
    mode === "switcher" ? currentItem : (externalValue ?? null);

  // Обработчик выбора элемента
  const handleSelect = useCallback(
    (item: T | null) => {
      if (mode === "switcher") {
        setCurrentItem(item);
      } else if (externalOnChange) {
        externalOnChange(item);
      }
    },
    [mode, setCurrentItem, externalOnChange]
  );

  return {
    selectedItem,
    handleSelect,
  };
}
