import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rolesApi,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from "../api/roles";
import { queryKeys } from "../query/queryKeys";

export const useRolesQuery = () => {
  return useQuery({
    queryKey: queryKeys.roles(),
    queryFn: () => rolesApi.getRoles().then(res => res.data),
  });
};

export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) =>
      rolesApi.createRole(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles() });
    },
  });
};

export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesApi.updateRole(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles() });
    },
  });
};

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles() });
    },
  });
};

export const useGeneratePromptMutation = () => {
  return useMutation({
    mutationFn: (roleName: string) =>
      rolesApi.generatePrompt(roleName).then(res => res.data.prompt),
  });
};
