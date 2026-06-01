"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  jobOpeningsService,
  type ListJobOpeningsResponse,
} from "@/features/job-openings/services/job-openings.service";
import type {
  CreateJobOpeningPayload,
  ListJobOpeningsParams,
  ReplaceJobOpeningSkillsPayload,
  UpdateJobOpeningPayload,
} from "@/features/job-openings/types/job-openings.types";

export const JOB_OPENINGS_QUERY_KEYS = {
  all: ["job-openings"] as const,
  list: (params: ListJobOpeningsParams) =>
    ["job-openings", "list", params] as const,
  detail: (id: string) => ["job-openings", "detail", id] as const,
};

export function useJobOpenings(params: ListJobOpeningsParams) {
  return useQuery<ListJobOpeningsResponse>({
    queryKey: JOB_OPENINGS_QUERY_KEYS.list(params),
    queryFn: () => jobOpeningsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useJobOpening(id: string) {
  return useQuery({
    queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
    queryFn: () => jobOpeningsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobOpeningPayload) =>
      jobOpeningsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateJobOpeningPayload) =>
      jobOpeningsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useReplaceJobOpeningSkills(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReplaceJobOpeningSkillsPayload) =>
      jobOpeningsService.replaceSkills(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function usePublishJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => jobOpeningsService.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useUnpublishJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => jobOpeningsService.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useOpenJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => jobOpeningsService.open(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useCloseJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => jobOpeningsService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: JOB_OPENINGS_QUERY_KEYS.detail(id),
      });
    },
  });
}

export function useSoftDeleteJobOpening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => jobOpeningsService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OPENINGS_QUERY_KEYS.all });
    },
  });
}
