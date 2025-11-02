import { createContext } from "react";

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);
