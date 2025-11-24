import React from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { Badge } from "@consta/uikit/Badge";

import type { IntegrationStatusLabel } from "@/features/TelegramIntegration/hooks/useTelegramUserStatus";
import "./IntegrationCardHeader.css";

interface IntegrationCardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  statusLabel?: IntegrationStatusLabel;
  isExpanded?: boolean;
}

export const IntegrationCardHeader: React.FC<IntegrationCardHeaderProps> = ({
  icon,
  title,
  subtitle,
  statusLabel,
}) => {
  return (
    <Layout
      direction="row"
      style={{ gap: "var(--space-s)", alignItems: "center" }}
      className="integration-card-header"
    >
      {icon ? (
        <div className="integration-card-header__icon">{icon}</div>
      ) : null}

      <Layout direction="column" className="integration-card-header__content">
        <Text size="l" weight="semibold" view="brand">
          {title}
        </Text>
        {subtitle ? (
          <Text size="s" view="secondary" className="hidden-mobile">
            {subtitle}
          </Text>
        ) : null}
        {statusLabel ? (
          <Badge
            size="xs"
            status={statusLabel.status}
            label={statusLabel.label}
            style={{ alignSelf: "flex-start" }}
          />
        ) : null}
      </Layout>
    </Layout>
  );
};
