import { createContext } from "react";
import type { AssistantRole } from "@/shared/api/roles";

export interface RoleContextType {
  roles: AssistantRole[];
  currentRole: AssistantRole | null;
  setCurrentRole: (role: AssistantRole | null) => void;
  refreshRoles: () => Promise<void>;
  isLoading: boolean;
}

export const RoleContext = createContext<RoleContextType | undefined>(
  undefined
);
