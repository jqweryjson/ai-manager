import { useMemo } from "react";
import type { DialogItem } from "@shared/api/telegramUser";

interface UseDialogsFilterParams {
  contactsData?: { dialogs: DialogItem[] };
  chatsData?: { dialogs: DialogItem[] };
  searchQuery: string;
  filters: {
    user: boolean;
    chat: boolean;
    channel: boolean;
  };
}

/**
 * Хук для фильтрации и объединения диалогов из контактов и чатов
 */
export function useDialogsFilter({
  contactsData,
  chatsData,
  searchQuery,
  filters,
}: UseDialogsFilterParams): DialogItem[] {
  const isSearchMode = searchQuery.trim().length > 0;
  const query = searchQuery.trim().toLowerCase();

  return useMemo(() => {
    const resultsMap = new Map<string, DialogItem>(); // Используем Map для дедупликации по peer_id

    // Сначала добавляем контакты (если включен фильтр user)
    if (filters.user && contactsData?.dialogs) {
      const contactsToAdd = isSearchMode
        ? // В режиме поиска фильтруем контакты
          contactsData.dialogs.filter(contact =>
            contact.title.toLowerCase().includes(query)
          )
        : // В обычном режиме показываем все контакты
          contactsData.dialogs;

      // Добавляем контакты в Map (ключ - peer_id)
      contactsToAdd.forEach(contact => {
        resultsMap.set(contact.peer_id, contact);
      });
    }

    // Затем добавляем чаты/группы/каналы (перезаписывают контакты, если есть дубликаты)
    if (chatsData?.dialogs) {
      const chatsToAdd = isSearchMode
        ? // В режиме поиска фильтруем по названию
          chatsData.dialogs.filter(chat =>
            chat.title.toLowerCase().includes(query)
          )
        : // В обычном режиме показываем все
          chatsData.dialogs;

      // Фильтруем по типу (чекбоксы) и добавляем в Map
      chatsToAdd
        .filter(chat => {
          const peerType = chat.peer_type;
          return peerType === "user"
            ? filters.user
            : peerType === "chat"
              ? filters.chat
              : filters.channel;
        })
        .forEach(chat => {
          resultsMap.set(chat.peer_id, chat); // Перезаписывает контакт, если есть дубликат
        });
    }

    // Преобразуем Map в массив
    return Array.from(resultsMap.values());
  }, [isSearchMode, query, filters, contactsData, chatsData]);
}
