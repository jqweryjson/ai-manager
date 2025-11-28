import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import type { UseMutationResult } from "@tanstack/react-query";

interface FileUploadSectionProps {
  onFileSelect: (file: File | null) => void;
  uploadMutation: UseMutationResult<
    { doc_id: string },
    Error,
    { file: File; workspaceId: string }
  >;
  disabled: boolean;
}

export const FileUploadSection = ({
  onFileSelect,
  uploadMutation,
  disabled,
}: FileUploadSectionProps) => {
  return (
    <>
      <input
        type="file"
        accept=".txt"
        style={{ display: "none" }}
        id="file-input"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
            e.target.value = "";
          }
        }}
      />

      <Button
        label={uploadMutation.isPending ? "Загрузка..." : "Выбрать файл (.txt)"}
        view="secondary"
        size="s"
        onClick={() => document.getElementById("file-input")?.click()}
        disabled={uploadMutation.isPending || disabled}
      />

      {uploadMutation.error && (
        <Text size="m" view="alert">
          {uploadMutation.error.message || "Ошибка загрузки"}
        </Text>
      )}

      {uploadMutation.isSuccess && (
        <Text size="m" view="success">
          Файл успешно загружен и обработан!
        </Text>
      )}
    </>
  );
};
