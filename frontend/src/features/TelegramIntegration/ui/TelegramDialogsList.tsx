import { useState, useMemo } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { useTelegramContacts } from "../hooks/useTelegramContacts";
import { useTelegramChats } from "../hooks/useTelegramChats";
import { useTelegramSubscriptions } from "../hooks/useTelegramSubscriptions";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { useDialogsFilter } from "../hooks/useDialogsFilter";
import { DialogsSearchBar } from "./DialogsSearchBar";
import { DialogsList } from "./DialogsList";

interface TelegramDialogsListProps {
  accountId?: string;
}

export const TelegramDialogsList = ({
  accountId,
}: TelegramDialogsListProps) => {
  const [search, debouncedSearch, setSearch] = useDebouncedSearch(3000);
  const [filters, setFilters] = useState<{
    user: boolean;
    chat: boolean;
    channel: boolean;
  }>({ user: true, chat: true, channel: true });

  // Полные списки контактов и всех диалогов (используем для всего)
  const {
    data: contactsData,
    isLoading: contactsLoading,
    error: contactsError,
  } = useTelegramContacts(accountId);

  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
  } = useTelegramChats(accountId);

  const { data: subscriptionsData, isLoading: subscriptionsLoading } =
    useTelegramSubscriptions(accountId);

  // Определяем loading и error состояния
  const isLoading = contactsLoading || chatsLoading || subscriptionsLoading;
  const error = contactsError || chatsError;

  // Фильтруем и объединяем диалоги
  const filteredDialogs = useDialogsFilter({
    contactsData,
    chatsData,
    searchQuery: search.trim(),
    filters,
  });

  // Перемещаем подключенные чаты наверх, сохраняя исходный порядок
  const sortedDialogs = useMemo(() => {
    const subscriptions = subscriptionsData?.subscriptions || [];
    const subscriptionsMap = new Map(
      subscriptions.map((sub: { peer_id: string; enabled: boolean }) => [
        sub.peer_id,
        sub,
      ])
    );

    // Разделяем на две группы: подключенные и неподключенные
    const enabled: typeof filteredDialogs = [];
    const disabled: typeof filteredDialogs = [];

    filteredDialogs.forEach(dialog => {
      const sub = subscriptionsMap.get(dialog.peer_id) as
        | { enabled: boolean }
        | undefined;
      if (sub?.enabled === true) {
        enabled.push(dialog);
      } else {
        disabled.push(dialog);
      }
    });

    // Сначала подключенные (в исходном порядке), потом неподключенные (в исходном порядке)
    return [...enabled, ...disabled];
  }, [filteredDialogs, subscriptionsData?.subscriptions]);

  const isSearchMode = search.trim().length > 0;

  return (
    <Layout direction="column" style={{ gap: "var(--space-s)", flex: "1" }}>
      <DialogsSearchBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={(type, checked) =>
          setFilters(prev => ({ ...prev, [type]: checked }))
        }
        isLoading={isLoading}
      />

      {isLoading ? (
        <Text view="secondary">Загрузка диалогов...</Text>
      ) : error ? (
        <Text view="alert">
          Ошибка загрузки диалогов:{" "}
          {error instanceof Error ? error.message : String(error)}
        </Text>
      ) : (
        <DialogsList
          dialogs={sortedDialogs}
          isSearchMode={isSearchMode}
          search={search}
          debouncedSearch={debouncedSearch}
          accountId={accountId || ""}
          subscriptions={subscriptionsData?.subscriptions || []}
        />
      )}
    </Layout>
  );
};
