import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspacesQuery } from "@/shared/hooks/useWorkspaces";
import {
  WorkspaceContext,
  type Workspace,
} from "@/shared/context/WorkspaceContext";

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { data, isLoading: qsLoading } = useWorkspacesQuery();
  const initializedRef = useRef(false);

  const refreshWorkspaces = async () => {
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  };

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem("current_workspace_id", workspace.id);
    } else {
      localStorage.removeItem("current_workspace_id");
    }
  };

  useEffect(() => {
    setIsLoading(qsLoading);
  }, [qsLoading]);

  useEffect(() => {
    if (!data || !data.workspaces) return;
    setWorkspaces(data.workspaces);

    // Инициализация выбранного workspace один раз
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedWorkspaceId = localStorage.getItem("current_workspace_id");
    if (savedWorkspaceId) {
      const saved = data.workspaces.find(w => w.id === savedWorkspaceId);
      if (saved) {
        setCurrentWorkspaceState(saved);
        return;
      }
    }
    if (data.workspaces.length > 0) {
      setCurrentWorkspaceState(data.workspaces[0]);
      localStorage.setItem("current_workspace_id", data.workspaces[0].id);
    }
  }, [data]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        refreshWorkspaces,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
