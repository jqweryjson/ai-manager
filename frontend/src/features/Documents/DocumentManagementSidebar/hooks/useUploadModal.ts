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

export const useUploadModal = (initialWorkspaceId?: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { currentWorkspace, workspaces } = useWorkspace();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    () => {
      if (initialWorkspaceId) {
        return workspaces.find(ws => ws.id === initialWorkspaceId) || null;
      }
      return currentWorkspace;
    }
  );
  const queryClient = useQueryClient();

  // Синхронизируем с currentWorkspace/initialWorkspaceId
  useEffect(() => {
    if (initialWorkspaceId) {
      const target =
        workspaces.find(ws => ws.id === initialWorkspaceId) || null;
      if (target && target.id !== selectedWorkspace?.id) {
        setSelectedWorkspace(target);
        return;
      }
    } else if (currentWorkspace && !selectedWorkspace) {
      setSelectedWorkspace(currentWorkspace);
    }
  }, [
    initialWorkspaceId,
    currentWorkspace,
    workspaces,
    selectedWorkspace?.id,
    selectedWorkspace,
  ]);

  const docsQuery = useDocumentsQuery(selectedWorkspace?.id);

  // Синхронизация списка с сервером
  useEffect(() => {
    if (docsQuery.data) {
      const mapped: Document[] = docsQuery.data.documents.map(d => ({
        id: d.doc_id,
        name: d.doc_id,
        uploadedAt: d.created_at ? new Date(d.created_at) : new Date(),
      }));
      setDocuments(mapped);
    }
  }, [docsQuery.data]);

  const uploadMutation = useUploadDocumentMutation(selectedWorkspace?.id);

  const onUploadSuccess = (result: { doc_id: string }, fileName: string) => {
    const newDoc: Document = {
      id: result.doc_id,
      name: fileName,
      uploadedAt: new Date(),
    };

    setDocuments(prev => [...prev, newDoc]);
    setSelectedFile(null);
    // Инвалидируем кэш чтобы получить актуальные данные с сервера
    queryClient.invalidateQueries({
      queryKey: ["documents", selectedWorkspace?.id],
    });
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

    // Сохраняем имя файла для использования в onSuccess
    const fileName = file.name;

    // Сразу загружаем файл после выбора
    if (selectedWorkspace) {
      uploadMutation.mutate(
        { file, workspaceId: selectedWorkspace.id },
        {
          onSuccess: result => onUploadSuccess(result, fileName),
        }
      );
    }
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
    handleDelete,
  };
};
