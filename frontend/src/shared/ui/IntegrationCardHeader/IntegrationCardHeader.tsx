import React from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import "./IntegrationCardHeader.css";

interface IntegrationCardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  statusLabel?: string;
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
      <Layout direction="column" style={{ gap: "var(--space-3xs)" }}>
        <Text size="l" weight="semibold" view="brand">
          {title}
        </Text>
        {subtitle ? (
          <Text size="s" view="secondary">
            {subtitle}
          </Text>
        ) : null}
        {statusLabel ? (
          <Text size="xs" view="ghost">
            Статус: {statusLabel}
          </Text>
        ) : null}
      </Layout>
    </Layout>
  );
};
