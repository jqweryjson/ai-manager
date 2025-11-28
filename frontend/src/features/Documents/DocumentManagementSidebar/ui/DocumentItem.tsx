import { Card } from "@consta/uikit/Card";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { IconTrash } from "@consta/icons/IconTrash";
import type { Document } from "../types";
import { formatDate } from "../lib/utils";

interface DocumentItemProps {
  document: Document;
  onDelete: () => void;
}

export const DocumentItem = ({ document, onDelete }: DocumentItemProps) => {
  return (
    <Card
      verticalSpace="m"
      horizontalSpace="l"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Text size="m" weight="semibold" view="primary">
          📄 {document.name}
        </Text>
        <Text size="s" view="secondary">
          {formatDate(document.uploadedAt)}
        </Text>
      </div>
      <Button
        onlyIcon
        iconLeft={IconTrash}
        view="ghost"
        size="xs"
        onClick={onDelete}
      />
    </Card>
  );
};
