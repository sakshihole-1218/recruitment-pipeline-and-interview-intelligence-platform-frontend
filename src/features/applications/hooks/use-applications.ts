"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applicationsService,
  type ListApplicationsResponse,
} from "@/features/applications/services/applications.service";
import type {
  BulkAssignHiringManagerPayload,
  BulkAssignRecruiterPayload,
  BulkMoveApplicationStagePayload,
  BulkRejectApplicationsPayload,
  CompleteApplicationScreeningPayload,
  CreateApplicationPayload,
  HoldApplicationPayload,
  ListApplicationsParams,
  RejectApplicationPayload,
  WithdrawApplicationPayload,
} from "@/features/applications/types/applications.types";

export const APPLICATIONS_QUERY_KEYS = {
  all: ["applications"] as const,
  list: (params: ListApplicationsParams) =>
    ["applications", "list", params] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
  stageHistory: (id: string) =>
    ["applications", "stage-history", id] as const,
};

export function useApplications(params: ListApplicationsParams) {
  return useQuery<ListApplicationsResponse>({
    queryKey: APPLICATIONS_QUERY_KEYS.list(params),
    queryFn: () => applicationsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
    queryFn: () => applicationsService.getById(id),
    enabled: !!id,
  });
}

export function useApplicationStageHistory(id: string) {
  return useQuery({
    queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
    queryFn: () => applicationsService.listStageHistory(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) =>
      applicationsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
    },
  });
}

export function useStartApplicationScreening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => applicationsService.startScreening(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
      });
    },
  });
}

export function useCompleteApplicationScreening(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteApplicationScreeningPayload) =>
      applicationsService.completeScreening(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
      });
    },
  });
}

export function useRejectApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RejectApplicationPayload) =>
      applicationsService.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
      });
    },
  });
}

export function useHoldApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HoldApplicationPayload) =>
      applicationsService.hold(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
      });
    },
  });
}

export function useWithdrawApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawApplicationPayload) =>
      applicationsService.withdraw(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEYS.stageHistory(id),
      });
    },
  });
}

export function useBulkMoveApplicationStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkMoveApplicationStagePayload) =>
      applicationsService.bulkMoveStage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
    },
  });
}

export function useBulkRejectApplications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkRejectApplicationsPayload) =>
      applicationsService.bulkReject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
    },
  });
}

export function useBulkAssignRecruiter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignRecruiterPayload) =>
      applicationsService.bulkAssignRecruiter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
    },
  });
}

export function useBulkAssignHiringManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignHiringManagerPayload) =>
      applicationsService.bulkAssignHiringManager(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEYS.all });
    },
  });
}
