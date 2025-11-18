import { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";

/**
 * Хук для debounced поиска
 * @param delay - задержка в миллисекундах (по умолчанию 3000)
 * @returns [search, debouncedSearch, setSearch] - текущий поиск, debounced поиск, функция установки
 */
export function useDebouncedSearch(delay: number = 3000) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Создаем debounced функцию с помощью lodash
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, delay),
    [delay]
  );

  // Очищаем debounce при размонтировании
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Вызываем debounced функцию при изменении search
  useEffect(() => {
    debouncedSetSearch(search);
  }, [search, debouncedSetSearch]);

  return [search, debouncedSearch, setSearch] as const;
}


