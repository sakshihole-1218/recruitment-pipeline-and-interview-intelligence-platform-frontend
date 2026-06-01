"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  skillsService,
  type ListSkillsResponse,
} from "@/features/skills/services/skills.service";
import type {
  CreateSkillPayload,
  ListSkillsParams,
  UpdateSkillPayload,
} from "@/features/skills/types/skills.types";

export const SKILLS_QUERY_KEYS = {
  all: ["skills"] as const,
  list: (params: ListSkillsParams) => ["skills", "list", params] as const,
  detail: (id: string) => ["skills", "detail", id] as const,
};

export function useSkills(params: ListSkillsParams) {
  return useQuery<ListSkillsResponse>({
    queryKey: SKILLS_QUERY_KEYS.list(params),
    queryFn: () => skillsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: SKILLS_QUERY_KEYS.detail(id),
    queryFn: () => skillsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSkillPayload) => skillsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateSkill(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSkillPayload) => skillsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.detail(id) });
    },
  });
}

export function useUpdateSkillStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (is_active: boolean) => skillsService.updateStatus(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.detail(id) });
    },
  });
}

export function useSoftDeleteSkill(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => skillsService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEYS.all });
    },
  });
}
