import { useState } from "react";
import { Button } from "@consta/uikit/Button";
import { IconLayers } from "@consta/icons/IconLayers";
import { DocumentManagementSidebar } from "../DocumentManagementSidebar";
import { Text } from "@consta/uikit/Text";

interface DocumentManagementPanelProps {
  onDocumentsChange?: () => void;
  containerSelector?: string;
}

export const DocumentManagementPanel = ({
  onDocumentsChange,
  containerSelector,
}: DocumentManagementPanelProps) => {
  const [isDocumentManagementSidebarOpen, setIsDocumentManagementSidebarOpen] =
    useState(false);

  const handleOpenUpload = () => {
    setIsDocumentManagementSidebarOpen(true);
  };

  const handleCloseUpload = () => {
    setIsDocumentManagementSidebarOpen(false);
    // Вызываем коллбэк если документы изменились
    onDocumentsChange?.();
  };

  return (
    <>
      <div>
        <Text size="xs" weight="semibold" view="secondary">
          База знаний
        </Text>
        <Button
          size="xs"
          view="ghost"
          iconLeft={IconLayers}
          onClick={handleOpenUpload}
          label="Управление базой знаний"
        />

        <Text size="2xs" view="ghost">
          На основе чего отвечает ассистент
        </Text>
      </div>

      {isDocumentManagementSidebarOpen && (
        <DocumentManagementSidebar
          isOpen
          onClose={handleCloseUpload}
          containerSelector={containerSelector}
        />
      )}
    </>
  );
};
