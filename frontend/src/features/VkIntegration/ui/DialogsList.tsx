import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Text } from "@consta/uikit/Text";
import type { VkDialogItem, VkSubscriptionItem } from "@shared/api/vkUser";
import { DialogItem } from "./DialogItem";
import "./VkDialogsList.css";

interface DialogsListProps {
  dialogs: VkDialogItem[];
  accountId: string;
  subscriptions: VkSubscriptionItem[];
  isSearchMode: boolean;
  search: string;
}

export const DialogsList = ({
  dialogs,
  accountId,
  subscriptions,
  isSearchMode,
  search,
}: DialogsListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: dialogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  if (dialogs.length === 0) {
    return (
      <Text view="secondary" size="s">
        {isSearchMode ? "Ничего не найдено" : search.trim() ? "Идет поиск..." : "Нет диалогов"}
      </Text>
    );
  }

  return (
    <div ref={parentRef} className="vk-dialogs-list">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const dialog = dialogs[virtualItem.index];
          const subscription = subscriptions.find(s => s.peer_id === dialog.peer_id);

          return (
            <div
              key={`${dialog.peer_type}_${dialog.peer_id}`}
              ref={virtualizer.measureElement}
              className="vk-dialogs-list__item"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <DialogItem
                dialog={dialog}
                accountId={accountId}
                subscription={subscription}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};


