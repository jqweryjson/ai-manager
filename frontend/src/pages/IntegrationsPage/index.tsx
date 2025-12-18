import { useState } from "react";
import { Layout } from "@consta/uikit/Layout";
import { TelegramIntegrationCard } from "@/features/TelegramIntegration";
import "./styles.css";

type IntegrationCardBaseProps = {
  isExpanded: boolean;
  onExpand: (isExpanded: boolean) => void;
};

type IntegrationConfig = {
  id: string;
  component: React.ComponentType<IntegrationCardBaseProps>;
  props: Omit<
    IntegrationCardBaseProps,
    "isExpanded" | "onExpand" | "onCollapse"
  >;
};

export const IntegrationsPage = () => {
  // По умолчанию раскрываем Telegram-интеграцию
  const [expandedIntegrationId, setExpandedIntegrationId] = useState<
    string | null
  >("telegram");

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
      {expandedIntegration ? (
        <div className="integrations-page__expanded">
          <expandedIntegration.component
            key={expandedIntegration.id}
            {...expandedIntegration.props}
            isExpanded={true}
            onExpand={isExpanded =>
              setExpandedIntegrationId(
                isExpanded ? expandedIntegration.id : null
              )
            }
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
                onExpand={isExpanded =>
                  setExpandedIntegrationId(isExpanded ? integration.id : null)
                }
              />
            );
          })}
        </div>
      )}
    </Layout>
  );
};
