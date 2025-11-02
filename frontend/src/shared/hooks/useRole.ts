import { useContext } from "react";
import { RoleContext } from "@/shared/context/RoleContext";

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
};
