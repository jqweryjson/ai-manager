import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Text } from "@consta/uikit/Text";
import type {
  DialogItem as DialogItemType,
  SubscriptionItem,
} from "@shared/api/telegramUser";
import { DialogItem } from "./DialogItem";
import "./TelegramDialogsList.css";

interface DialogsListProps {
  dialogs: DialogItemType[];
  isSearchMode: boolean;
  search: string;
  debouncedSearch: string;
  accountId: string;
  subscriptions: SubscriptionItem[];
}

export const DialogsList = ({
  dialogs,
  isSearchMode,
  search,
  debouncedSearch,
  accountId,
  subscriptions,
}: DialogsListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: dialogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // средняя высота элемента списка
    overscan: 10,
  });

  if (dialogs.length === 0) {
    return (
      <Text view="secondary" size="s">
        {isSearchMode
          ? "Ничего не найдено"
          : search.trim().length > 0 && debouncedSearch.trim().length === 0
            ? "Идет поиск..."
            : "Нет диалогов"}
      </Text>
    );
  }

  return (
    <div ref={parentRef} className="tg-dialogs-list">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const item = dialogs[virtualItem.index];
          const subscription = subscriptions.find(
            s => s.peer_id === item.peer_id
          );
          return (
            <div
              key={`${item.peer_type}_${item.peer_id}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <DialogItem
                item={item}
                account_id={accountId}
                subscription={subscription}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
