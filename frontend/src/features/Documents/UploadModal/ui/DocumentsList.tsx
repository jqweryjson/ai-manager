import { Text } from "@consta/uikit/Text";
import { Layout } from "@consta/uikit/Layout";
import type { Document } from "../types";
import { DocumentItem } from "./DocumentItem";

interface DocumentsListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export const DocumentsList = ({ documents, onDelete }: DocumentsListProps) => {
  if (documents.length === 0) return null;

  return (
    <Layout direction="column" style={{ gap: "var(--space-m)" }}>
      <Text size="l" weight="semibold" view="primary">
        Загруженные документы:
      </Text>

      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onDelete={() => onDelete(doc.id)}
        />
      ))}
    </Layout>
  );
};
