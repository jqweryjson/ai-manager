import { useLayoutEffect, useState } from "react";
import { Sidebar } from "@consta/uikit/Sidebar";
import { Layout } from "@consta/uikit/Layout";
import { useUploadModal } from "./hooks/useUploadModal";
import { ModalHeader } from "./ui/ModalHeader";
import { FileUploadSection } from "./ui/FileUploadSection";
import { DocumentsList } from "./ui/DocumentsList";
import { EmptyState } from "./ui/EmptyState";
import "./styles.css";
import { WorkspaceCombobox } from "@/widgets/WorkspaceCombobox";

interface DocumentManagementSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  containerSelector?: string;
}

export const DocumentManagementSidebar = ({
  isOpen,
  onClose,
  containerSelector,
}: DocumentManagementSidebarProps) => {
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

  const [sidebarContainer, setSidebarContainer] =
    useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerSelector) {
      setSidebarContainer(
        document.querySelector(containerSelector) as HTMLDivElement | null
      );
    }
  }, [containerSelector]);

  return (
    <Sidebar
      isOpen={isOpen}
      onEsc={onClose}
      hasOverlay
      position="right"
      size="full"
      container={sidebarContainer ?? undefined}
      rootClassName="full-sidebar-custom"
    >
      <Layout direction="column" className="documents-sidebar__content">
        <ModalHeader onClose={onClose} />

        <div className="documents-sidebar__section">
          <WorkspaceCombobox
            mode="selector"
            value={selectedWorkspace}
            onChange={setSelectedWorkspace}
          />
        </div>

        <div className="documents-sidebar__section">
          <FileUploadSection
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            uploadMutation={uploadMutation}
            disabled={!selectedWorkspace}
          />
        </div>

        <div className="documents-sidebar__list-section">
          <DocumentsList documents={documents} onDelete={handleDelete} />
          <EmptyState
            isLoading={docsQuery.isLoading}
            isEmpty={documents.length === 0}
          />
        </div>
      </Layout>
    </Sidebar>
  );
};
