import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRolesQuery } from "@/shared/hooks/useRoles";
import {
  RoleContext,
  type RoleContextType,
} from "@/shared/context/RoleContext";
import type { AssistantRole } from "@/shared/api/roles";

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<AssistantRole[]>([]);
  const [currentRole, setCurrentRoleState] = useState<AssistantRole | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { data, isLoading: qsLoading } = useRolesQuery();
  const initializedRef = useRef(false);

  const refreshRoles = async () => {
    await queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  const setCurrentRole = (role: AssistantRole | null) => {
    setCurrentRoleState(role);
    if (role) {
      localStorage.setItem("current_role_id", role.id);
    } else {
      localStorage.removeItem("current_role_id");
    }
  };

  useEffect(() => {
    setIsLoading(qsLoading);
  }, [qsLoading]);

  useEffect(() => {
    if (!data) return;
    setRoles(data);

    // Инициализация выбранной роли один раз
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedRoleId = localStorage.getItem("current_role_id");
    if (savedRoleId) {
      const saved = data.find(r => r.id === savedRoleId);
      if (saved) {
        setCurrentRoleState(saved);
        return;
      }
    }
    if (data.length > 0) {
      setCurrentRoleState(data[0]);
      localStorage.setItem("current_role_id", data[0].id);
    }
  }, [data]);

  const contextValue: RoleContextType = {
    roles,
    currentRole,
    setCurrentRole,
    refreshRoles,
    isLoading,
  };

  return (
    <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>
  );
};
