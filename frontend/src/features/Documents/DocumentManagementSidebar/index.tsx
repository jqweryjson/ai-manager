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
  initialWorkspaceId?: string;
}

export const DocumentManagementSidebar = ({
  isOpen,
  onClose,
  containerSelector,
  initialWorkspaceId,
}: DocumentManagementSidebarProps) => {
  const {
    documents,
    selectedWorkspace,
    setSelectedWorkspace,
    docsQuery,
    uploadMutation,
    handleFileSelect,
    handleDelete,
  } = useUploadModal(initialWorkspaceId);

  const [sidebarContainer, setSidebarContainer] =
    useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerSelector) {
      setSidebarContainer(
        document.querySelector(containerSelector) as HTMLDivElement | null
      );
    } else {
      setSidebarContainer(document.body as HTMLDivElement);
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
            enableDocumentsAction={false}
            disabled={true}
          />
        </div>

        <div
          className="documents-sidebar__section"
          style={{ textAlign: "right" }}
        >
          <FileUploadSection
            onFileSelect={handleFileSelect}
            uploadMutation={uploadMutation}
            disabled={!selectedWorkspace}
          />
        </div>

        <div className="documents-sidebar__list-section">
          <div className="documents-list">
            <DocumentsList documents={documents} onDelete={handleDelete} />
          </div>
          <EmptyState
            isLoading={docsQuery.isLoading}
            isEmpty={documents.length === 0}
          />
        </div>
      </Layout>
    </Sidebar>
  );
};
