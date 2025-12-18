import { Text } from "@consta/uikit/Text";
import { Badge } from "@consta/uikit/Badge";
import type { VkDialogItem, VkSubscriptionItem } from "@shared/api/vkUser";
import { peerTypeMeta } from "./constants";
import { SubscriptionConfigPanel } from "./SubscriptionConfigPanel";
import "./VkDialogsList.css";

type DialogItemProps = {
  dialog: VkDialogItem;
  accountId: string;
  subscription: VkSubscriptionItem | undefined;
};

export const DialogItem = ({ dialog, accountId, subscription }: DialogItemProps) => {
  return (
    <div
      id={`${dialog.peer_type}_${dialog.peer_id}`}
      className={`vk-dialogs-item ${subscription?.enabled ? "vk-dialogs-item--enabled" : ""}`}
    >
      <div className="vk-dialogs-item__header">
        <span className="vk-dialogs-item__emoji hidden-mobile">
          {peerTypeMeta[dialog.peer_type].emoji}
        </span>

        <div className="vk-dialogs-item__titles">
          <Text size="s" view="primary" lineHeight="xs" truncate>
            {dialog.title}
          </Text>
          <Text size="xs" view="secondary" lineHeight="2xs" truncate>
            {peerTypeMeta[dialog.peer_type].label}
          </Text>
        </div>

        {dialog.unread_count > 0 ? (
          <Badge
            form="round"
            size="s"
            status="system"
            label={String(dialog.unread_count)}
            style={{ alignSelf: "flex-start" }}
          />
        ) : null}
      </div>

      <SubscriptionConfigPanel
        accountId={accountId}
        dialog={dialog}
        subscription={subscription}
      />
    </div>
  );
};


