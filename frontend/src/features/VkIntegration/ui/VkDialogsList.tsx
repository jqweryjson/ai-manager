import { useMemo, useState } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { SkeletonBrick } from "@consta/uikit/Skeleton";
import { useVkUserConversations } from "../hooks/useVkUserConversations";
import { useVkUserSubscriptions } from "../hooks/useVkUserSubscriptions";
import { DialogsList } from "./DialogsList";
import type { VkDialogItem } from "@shared/api/vkUser";
import "./VkDialogsList.css";

interface VkDialogsListProps {
  accountId: string;
}

export const VkDialogsList = ({ accountId }: VkDialogsListProps) => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    user: true,
    chat: true,
    group: true,
  });

  const {
    data: convData,
    isLoading: convLoading,
    error: convError,
  } = useVkUserConversations(accountId);

  const {
    data: subsData,
    isLoading: subsLoading,
    error: subsError,
  } = useVkUserSubscriptions(accountId);

  const isLoading = convLoading || subsLoading;
  const error = convError || subsError;

  const dialogs = convData?.dialogs || [];
  const subscriptions = subsData?.subscriptions || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dialogs.filter((d: VkDialogItem) => {
      if (!filters[d.peer_type]) return false;
      if (!q) return true;
      return d.title.toLowerCase().includes(q) || d.peer_id.includes(q);
    });
  }, [dialogs, filters, search]);

  const sorted = useMemo(() => {
    const subsMap = new Map(subscriptions.map(s => [s.peer_id, s]));
    const enabled: VkDialogItem[] = [];
    const has: VkDialogItem[] = [];
    const none: VkDialogItem[] = [];

    for (const d of filtered) {
      const sub = subsMap.get(d.peer_id);
      if (!sub) {
        none.push(d);
      } else if (sub.enabled) {
        enabled.push(d);
      } else {
        has.push(d);
      }
    }
    return [...enabled, ...has, ...none];
  }, [filtered, subscriptions]);

  const isSearchMode = search.trim().length > 0;

  return (
    <Layout direction="column" className="vk-dialogs__container">
      <Layout direction="row" className="vk-dialogs__searchbar">
        <input
          className="vk-dialogs__input"
          placeholder="Поиск по названию или ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="vk-dialogs__filter">
          <input
            type="checkbox"
            checked={filters.user}
            onChange={e => setFilters(p => ({ ...p, user: e.target.checked }))}
          />
          user
        </label>
        <label className="vk-dialogs__filter">
          <input
            type="checkbox"
            checked={filters.chat}
            onChange={e => setFilters(p => ({ ...p, chat: e.target.checked }))}
          />
          chat
        </label>
        <label className="vk-dialogs__filter">
          <input
            type="checkbox"
            checked={filters.group}
            onChange={e => setFilters(p => ({ ...p, group: e.target.checked }))}
          />
          group
        </label>
      </Layout>

      {isLoading ? (
        <SkeletonBrick height={"100%"} width={"100%"} />
      ) : error ? (
        <Text view="alert">
          Ошибка загрузки диалогов:{" "}
          {error instanceof Error ? error.message : String(error)}
        </Text>
      ) : (
        <DialogsList
          dialogs={sorted}
          accountId={accountId}
          subscriptions={subscriptions}
          isSearchMode={isSearchMode}
          search={search}
        />
      )}
    </Layout>
  );
};


