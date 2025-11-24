import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUploadDocumentMutation,
  useDocumentsQuery,
} from "@/shared/hooks/useDocuments";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import { deleteDocument } from "@/shared/api/documents";
import type { Document } from "../types";
import type { Workspace } from "@/shared/context/WorkspaceContext";

export const useUploadModal = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { currentWorkspace } = useWorkspace();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    currentWorkspace
  );
  const queryClient = useQueryClient();

  // Синхронизируем с currentWorkspace при первой загрузке
  useEffect(() => {
    if (currentWorkspace && !selectedWorkspace) {
      setSelectedWorkspace(currentWorkspace);
    }
  }, [currentWorkspace, selectedWorkspace]);

  const docsQuery = useDocumentsQuery(selectedWorkspace?.id);

  // Синхронизация списка с сервером
  useEffect(() => {
    if (docsQuery.data) {
      const mapped: Document[] = docsQuery.data.documents.map(d => ({
        id: d.doc_id,
        name: d.doc_id,
        size: 0,
        uploadedAt: new Date(),
      }));
      setDocuments(mapped);
    }
  }, [docsQuery.data]);

  const uploadMutation = useUploadDocumentMutation(selectedWorkspace?.id);

  const onUploadSuccess = (result: { doc_id: string }) => {
    const newDoc: Document = {
      id: result.doc_id,
      name: selectedFile!.name,
      size: selectedFile!.size,
      uploadedAt: new Date(),
    };

    setDocuments(prev => [...prev, newDoc]);
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Проверка типа файла
    if (!file.name.endsWith(".txt")) {
      uploadMutation.reset();
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    uploadMutation.reset();
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedWorkspace) return;
    uploadMutation.mutate(
      { file: selectedFile, workspaceId: selectedWorkspace.id },
      { onSuccess: onUploadSuccess }
    );
  };

  const handleDelete = async (id: string) => {
    if (!selectedWorkspace) return;
    try {
      await deleteDocument(id, selectedWorkspace.id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      // Обновляем список документов в кэше
      queryClient.invalidateQueries({
        queryKey: ["documents", selectedWorkspace.id],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    // Состояния
    documents,
    selectedFile,
    selectedWorkspace,
    setSelectedWorkspace,
    docsQuery,
    uploadMutation,

    // Обработчики
    handleFileSelect,
    handleUpload,
    handleDelete,
  };
};
