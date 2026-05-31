"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { rolesService } from "@/features/roles/services/roles.service";
import type { ListRolesParams } from "@/features/roles/types/roles.types";

export const ROLES_QUERY_KEYS = {
  all: ["roles"] as const,
  list: (params: ListRolesParams) => ["roles", "list", params] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
};

export function useRoles(params: ListRolesParams) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.list(params),
    queryFn: () => rolesService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.detail(id),
    queryFn: () => rolesService.getById(id),
    enabled: !!id,
  });
}
