import { useState } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { TelegramIntegrationCard } from "@/features/TelegramIntegration";
import type { TelegramIntegrationCardProps } from "@/features/TelegramIntegration";
import "./styles.css";

type IntegrationConfig = {
  id: string;
  component: React.ComponentType<TelegramIntegrationCardProps>;
  props: Omit<
    TelegramIntegrationCardProps,
    "isExpanded" | "onExpand" | "onCollapse"
  >;
};

export const IntegrationsPage = () => {
  const [expandedIntegrationId, setExpandedIntegrationId] = useState<
    string | null
  >(null);

  const integrations: IntegrationConfig[] = [
    {
      id: "telegram",
      component: TelegramIntegrationCard,
      props: {},
    },
  ];

  const expandedIntegration = integrations.find(
    int => int.id === expandedIntegrationId
  );

  return (
    <Layout direction="column" className="integrations-page">
      <Layout direction="column" style={{ gap: "var(--space-2xs)" }}>
        <Text size="2xl" weight="bold" view="brand">
          Интеграции
        </Text>
        <Text size="s" view="secondary">
          Подключайте системы и мессенджеры, чтобы ассистент отвечал
          пользователям автоматически.
        </Text>
      </Layout>

      {expandedIntegration ? (
        <div className="integrations-page__expanded">
          <expandedIntegration.component
            key={expandedIntegration.id}
            {...expandedIntegration.props}
            isExpanded={true}
            onExpand={() => setExpandedIntegrationId(expandedIntegration.id)}
            onCollapse={() => setExpandedIntegrationId(null)}
          />
        </div>
      ) : (
        <div className="integrations-page__grid">
          {integrations.map(integration => {
            const IntegrationComponent = integration.component;
            return (
              <IntegrationComponent
                key={integration.id}
                {...integration.props}
                isExpanded={false}
                onExpand={() => setExpandedIntegrationId(integration.id)}
                onCollapse={() => setExpandedIntegrationId(null)}
              />
            );
          })}
        </div>
      )}
    </Layout>
  );
};
