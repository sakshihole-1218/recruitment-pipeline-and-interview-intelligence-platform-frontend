"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  departmentsService,
  type ListDepartmentsResponse,
} from "@/features/departments/services/departments.service";
import type {
  CreateDepartmentPayload,
  ListDepartmentsParams,
  UpdateDepartmentPayload,
} from "@/features/departments/types/departments.types";

export const DEPARTMENTS_QUERY_KEYS = {
  all: ["departments"] as const,
  list: (params: ListDepartmentsParams) =>
    ["departments", "list", params] as const,
  detail: (id: string) => ["departments", "detail", id] as const,
};

export function useDepartments(params: ListDepartmentsParams) {
  return useQuery<ListDepartmentsResponse>({
    queryKey: DEPARTMENTS_QUERY_KEYS.list(params),
    queryFn: () => departmentsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEYS.detail(id),
    queryFn: () => departmentsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) =>
      departmentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) =>
      departmentsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: DEPARTMENTS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useUpdateDepartmentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (is_active: boolean) =>
      departmentsService.updateStatus(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: DEPARTMENTS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useSoftDeleteDepartment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => departmentsService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all });
    },
  });
}
