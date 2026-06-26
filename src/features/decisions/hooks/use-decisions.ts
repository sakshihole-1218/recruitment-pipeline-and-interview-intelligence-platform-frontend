"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { decisionService } from "@/features/decisions/services/decision.service";
import type {
  CreateDecisionPayload,
  ListDecisionsParams,
  ListDecisionsResponse,
  UpdateDecisionPayload,
} from "@/features/decisions/types/decision.types";

export const DECISIONS_QUERY_KEYS = {
  all: ["decisions"] as const,
  list: (params: ListDecisionsParams) => ["decisions", "list", params] as const,
  detail: (id: string) => ["decisions", "detail", id] as const,
  byApplication: (applicationId: string) =>
    ["decisions", "application", applicationId] as const,
  eligibleApplications: ["decisions", "eligible-applications"] as const,
};

export function useDecisions(params: ListDecisionsParams) {
  return useQuery<ListDecisionsResponse>({
    queryKey: DECISIONS_QUERY_KEYS.list(params),
    queryFn: () => decisionService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDecision(id: string) {
  return useQuery({
    queryKey: DECISIONS_QUERY_KEYS.detail(id),
    queryFn: () => decisionService.getById(id),
    enabled: !!id,
  });
}

export function useDecisionByApplication(applicationId: string) {
  return useQuery({
    queryKey: DECISIONS_QUERY_KEYS.byApplication(applicationId),
    queryFn: () => decisionService.getByApplicationId(applicationId),
    enabled: !!applicationId,
    retry: false,
  });
}

export function useEligibleDecisionApplications() {
  return useQuery({
    queryKey: DECISIONS_QUERY_KEYS.eligibleApplications,
    queryFn: () => decisionService.getEligibleApplications(),
    staleTime: 60 * 1000,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDecisionPayload) => decisionService.create(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: DECISIONS_QUERY_KEYS.byApplication(response.data.application_id),
      });
    },
  });
}

export function useUpdateDecision(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDecisionPayload) =>
      decisionService.update(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({
        queryKey: DECISIONS_QUERY_KEYS.byApplication(response.data.application_id),
      });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => decisionService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DECISIONS_QUERY_KEYS.all });
    },
  });
}
