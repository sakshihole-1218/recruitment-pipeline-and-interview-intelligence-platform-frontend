"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { rolesService, usersService } from "@/features/users/services/users.service";
import type {
  CreateUserPayload,
  ListUsersParams,
  UpdateUserPayload,
} from "@/features/users/types/users.types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const USERS_QUERY_KEYS = {
  all: ["users"] as const,
  list: (params: ListUsersParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  roles: ["roles", "list"] as const,
};

// ---------------------------------------------------------------------------
// List users
// ---------------------------------------------------------------------------
export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(params),
    queryFn: () => usersService.list(params),
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------------------
// Get user by id
// ---------------------------------------------------------------------------
export function useUser(id: string) {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Update user
// ---------------------------------------------------------------------------
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      usersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.detail(id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Toggle user active status (activate / deactivate)
// ---------------------------------------------------------------------------
export function useToggleUserStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (is_active: boolean) =>
      usersService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.detail(id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Assign role to user
// ---------------------------------------------------------------------------
export function useAssignRole(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => usersService.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Remove role from user
// ---------------------------------------------------------------------------
export function useRemoveRole(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => usersService.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// List roles (for selects / pickers)
// ---------------------------------------------------------------------------
export function useRoles() {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.roles,
    queryFn: () => rolesService.list(),
    staleTime: 5 * 60 * 1000, // roles don't change frequently
  });
}
