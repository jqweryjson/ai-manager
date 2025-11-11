import { Card } from "@consta/uikit/Card";
import { Text } from "@consta/uikit/Text";
import type { ChatRetrievalResponse } from "@/shared/api/chat";
import { Layout } from "@consta/uikit/Layout";
import "./RetrievalPanel.css";

interface RetrievalPanelProps {
  data: ChatRetrievalResponse | null;
}

export const RetrievalPanel = ({ data }: RetrievalPanelProps) => {
  if (!data) return null;

  return (
    <Layout direction="column" className="retrieval-panel">
      <div className="retrieval-panel__header">
        <Text size="s" weight="semibold" view="secondary">
          Результаты поиска (retrieval-only)
        </Text>
        <Text
          size="xs"
          view="secondary"
          style={{ marginTop: "var(--space-2xs)" }}
        >
          Время: total {data.stats.total_ms}ms (embed {data.stats.embedding_ms}
          ms / retrieve {data.stats.retrieve_ms}ms / ctx {data.stats.context_ms}
          ms)
        </Text>
      </div>

      <Layout direction="column" className="retrieval-panel__content">
        {data.context.map(item => (
          <Card
            key={item.id}
            className="retrieval-panel__card"
            verticalSpace="s"
            horizontalSpace="m"
          >
            <Text size="xs" view="secondary">
              doc: {item.doc_id} · chunk: {item.chunk_id} · score:{" "}
              {item.score.toFixed(4)}
            </Text>
            <Text
              size="s"
              view="primary"
              style={{ marginTop: "var(--space-xs)" }}
            >
              {item.text}
            </Text>
          </Card>
        ))}
      </Layout>
    </Layout>
  );
};
