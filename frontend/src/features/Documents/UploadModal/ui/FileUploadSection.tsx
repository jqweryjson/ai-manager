import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import { Layout } from "@consta/uikit/Layout";
import { Loader } from "@consta/uikit/Loader";
import type { UseMutationResult } from "@tanstack/react-query";
import { formatFileSize } from "../lib/utils";

interface FileUploadSectionProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  uploadMutation: UseMutationResult<
    { doc_id: string },
    Error,
    { file: File; workspaceId: string }
  >;
  disabled: boolean;
}

export const FileUploadSection = ({
  selectedFile,
  onFileSelect,
  onUpload,
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

      <Layout direction="row" style={{ gap: "var(--space-m)" }}>
        <Button
          label="Выбрать файл (.txt)"
          view="secondary"
          onClick={() => document.getElementById("file-input")?.click()}
          disabled={uploadMutation.isPending}
        />
        {selectedFile && (
          <Button
            label={uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
            view="primary"
            onClick={onUpload}
            disabled={uploadMutation.isPending || disabled}
          />
        )}
      </Layout>

      {selectedFile && !uploadMutation.isPending && (
        <Text size="s" view="secondary">
          Выбран: {selectedFile.name} ({formatFileSize(selectedFile.size)})
        </Text>
      )}

      {uploadMutation.isPending && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Loader />
        </div>
      )}

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
