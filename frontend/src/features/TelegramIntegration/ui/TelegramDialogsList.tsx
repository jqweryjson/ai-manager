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
import { SkeletonBrick } from "@consta/uikit/Skeleton";

import "./TelegramDialogsList.css";

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

  // Сортируем чаты: сначала все подписки (enabled=true сверху, enabled=false ниже), потом неподключенные
  const sortedDialogs = useMemo(() => {
    const subscriptions = subscriptionsData?.subscriptions || [];
    const subscriptionsMap = new Map(
      subscriptions.map((sub: { peer_id: string; enabled: boolean }) => [
        sub.peer_id,
        sub,
      ])
    );

    // Разделяем на три группы: активные подписки, неактивные подписки, без подписки
    const enabled: typeof filteredDialogs = [];
    const hasSubscription: typeof filteredDialogs = [];
    const noSubscription: typeof filteredDialogs = [];

    filteredDialogs.forEach(dialog => {
      const sub = subscriptionsMap.get(dialog.peer_id) as
        | { enabled: boolean }
        | undefined;
      if (sub) {
        // Есть подписка
        if (sub.enabled === true) {
          enabled.push(dialog);
        } else {
          hasSubscription.push(dialog);
        }
      } else {
        // Нет подписки
        noSubscription.push(dialog);
      }
    });

    // Сначала активные подписки, потом неактивные подписки, потом без подписки
    return [...enabled, ...hasSubscription, ...noSubscription];
  }, [filteredDialogs, subscriptionsData?.subscriptions]);

  const isSearchMode = search.trim().length > 0;

  return (
    <Layout direction="column" className="tg-dialogs-list__container">
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
        <SkeletonBrick height={"100%"} width={"100%"} />
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
