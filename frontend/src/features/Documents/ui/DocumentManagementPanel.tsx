import { useState } from "react";
import { Button } from "@consta/uikit/Button";
import { IconLayers } from "@consta/icons/IconLayers";
import { UploadModal } from "../UploadModal";
import { Text } from "@consta/uikit/Text";

interface DocumentManagementPanelProps {
  onDocumentsChange?: () => void;
}

export const DocumentManagementPanel = ({
  onDocumentsChange,
}: DocumentManagementPanelProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadModalOpen(false);
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

      {isUploadModalOpen && <UploadModal isOpen onClose={handleCloseUpload} />}
    </>
  );
};
