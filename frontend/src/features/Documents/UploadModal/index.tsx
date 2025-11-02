import { Modal } from "@consta/uikit/Modal";
import { Card } from "@consta/uikit/Card";
import { Layout } from "@consta/uikit/Layout";
import { useUploadModal } from "./hooks/useUploadModal";
import { ModalHeader } from "./ui/ModalHeader";
import { WorkspaceSelector } from "./ui/WorkspaceSelector";
import { FileUploadSection } from "./ui/FileUploadSection";
import { DocumentsList } from "./ui/DocumentsList";
import { EmptyState } from "./ui/EmptyState";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const {
    documents,
    selectedFile,
    selectedWorkspace,
    setSelectedWorkspace,
    docsQuery,
    uploadMutation,
    handleFileSelect,
    handleUpload,
    handleDelete,
  } = useUploadModal();

  return (
    <Modal isOpen={isOpen} onClickOutside={onClose} onEsc={onClose}>
      <Card
        verticalSpace="l"
        horizontalSpace="l"
        style={{ minWidth: "500px", maxWidth: "600px" }}
      >
        <Layout direction="column" style={{ gap: "var(--space-xl)" }}>
          <ModalHeader onClose={onClose} />

          <WorkspaceSelector
            value={selectedWorkspace}
            onChange={setSelectedWorkspace}
          />

          <FileUploadSection
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            uploadMutation={uploadMutation}
            disabled={!selectedWorkspace}
          />

          <DocumentsList documents={documents} onDelete={handleDelete} />

          <EmptyState
            isLoading={docsQuery.isLoading}
            isEmpty={documents.length === 0}
          />
        </Layout>
      </Card>
    </Modal>
  );
};
