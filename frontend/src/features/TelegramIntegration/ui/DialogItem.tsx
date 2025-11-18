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
  item: DialogItemType;
  account_id: string;
  subscription: SubscriptionItem | undefined;
};

export const DialogItem = ({
  item,
  account_id,
  subscription,
}: DialogItemProps) => {
  return (
    <div
      id={`${item.peer_type}_${item.peer_id}`}
      className={`tg-dialogs-item ${subscription?.enabled ? "tg-dialogs-item--enabled" : ""}`}
    >
      <div className="tg-dialogs-item__header">
        <span className="tg-dialogs-item__emoji">
          {peerTypeMeta[item.peer_type].emoji}
        </span>

        <div className="tg-dialogs-item__titles">
          <Text size="s" view="primary" lineHeight="xs">
            {item.title}
          </Text>

          <Text size="xs" view="secondary" lineHeight="2xs">
            {peerTypeMeta[item.peer_type].label}
          </Text>
        </div>

        {item.unread_count > 0 ? (
          <Badge
            form="round"
            size="s"
            status="system"
            label={String(item.unread_count)}
            style={{ alignSelf: "flex-start" }}
          />
        ) : null}
      </div>

      <div className="tg-dialogs-item__config">
        <SubscriptionConfigPanel
          peer_id={item.peer_id}
          peer_type={item.peer_type}
          title={item.title}
          account_id={account_id}
          workspace_id={subscription?.workspace_id || null}
          role_id={subscription?.role_id || null}
          enabled={subscription?.enabled || false}
        />
      </div>
    </div>
  );
};
