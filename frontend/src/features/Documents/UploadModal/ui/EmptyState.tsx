import { Text } from "@consta/uikit/Text";

interface EmptyStateProps {
  isLoading: boolean;
  isEmpty: boolean;
}

export const EmptyState = ({ isLoading, isEmpty }: EmptyStateProps) => {
  if (isLoading) {
    return (
      <Text size="m" view="secondary" align="center">
        Загрузка списка документов...
      </Text>
    );
  }

  if (isEmpty) {
    return (
      <Text size="m" view="secondary" align="center">
        Документы еще не загружены
      </Text>
    );
  }

  return null;
};
