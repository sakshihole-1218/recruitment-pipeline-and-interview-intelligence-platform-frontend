"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { interviewsService } from "@/features/interviews/services/interviews.service";
import type {
  CancelInterviewPayload,
  ListInterviewsParams,
  ReplaceInterviewPanelMembersPayload,
  RescheduleInterviewPayload,
  ScheduleInterviewPayload,
} from "@/features/interviews/types/interviews.types";

export const INTERVIEWS_QUERY_KEYS = {
  all: ["interviews"] as const,
  list: (params: ListInterviewsParams) => ["interviews", "list", params] as const,
  detail: (id: string) => ["interviews", "detail", id] as const,
};

export function useInterviews(params: ListInterviewsParams) {
  return useQuery({
    queryKey: INTERVIEWS_QUERY_KEYS.list(params),
    queryFn: () => interviewsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: INTERVIEWS_QUERY_KEYS.detail(id),
    queryFn: () => interviewsService.getById(id),
    enabled: !!id,
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScheduleInterviewPayload) => interviewsService.schedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.all });
    },
  });
}

export function useRescheduleInterview(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RescheduleInterviewPayload) => interviewsService.reschedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.detail(id) });
    },
  });
}

export function useCancelInterview(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelInterviewPayload) => interviewsService.cancel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.detail(id) });
    },
  });
}

export function useReplaceInterviewPanelMembers(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReplaceInterviewPanelMembersPayload) =>
      interviewsService.replacePanelMembers(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEYS.detail(id) });
    },
  });
}
