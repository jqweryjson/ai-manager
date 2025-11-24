import { Text } from "@consta/uikit/Text";
import type {
  DialogItem as DialogItemType,
  SubscriptionItem,
} from "@shared/api/telegramUser";
import { peerTypeMeta } from "./constants";
import { SubscriptionConfigPanel } from "./SubscriptionConfigPanel";
import { Badge } from "@consta/uikit/Badge";

import "./TelegramDialogsList.css";

type DialogItemProps = {
  dialog: DialogItemType;
  account_id: string;
  subscription: SubscriptionItem | undefined;
};

export const DialogItem = ({
  dialog,
  account_id,
  subscription,
}: DialogItemProps) => {
  return (
    <div
      id={`${dialog.peer_type}_${dialog.peer_id}`}
      className={`tg-dialogs-item ${subscription?.enabled ? "tg-dialogs-item--enabled" : ""}`}
    >
      <div className="tg-dialogs-item__header">
        <span className="tg-dialogs-item__emoji hidden-mobile">
          {peerTypeMeta[dialog.peer_type].emoji}
        </span>

        <div className="tg-dialogs-item__titles">
          <Text
            size="s"
            view="primary"
            lineHeight="xs"
            style={{ wordBreak: "break-all" }}
            truncate
          >
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
        account_id={account_id}
        dialog={dialog}
        subscription={subscription}
      />
    </div>
  );
};
