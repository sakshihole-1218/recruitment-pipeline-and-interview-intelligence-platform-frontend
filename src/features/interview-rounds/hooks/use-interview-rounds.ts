"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { interviewRoundsService } from "@/features/interview-rounds/services/interview-rounds.service";
import type {
  CreateInterviewRoundPayload,
  ListInterviewRoundsByJobOpeningParams,
  UpdateInterviewRoundPayload,
} from "@/features/interview-rounds/types/interview-rounds.types";

export const INTERVIEW_ROUNDS_QUERY_KEYS = {
  all: ["interview-rounds"] as const,
  byJobOpening: (params: ListInterviewRoundsByJobOpeningParams) =>
    ["interview-rounds", "by-job-opening", params] as const,
};

export function useInterviewRoundsByJobOpening(params: ListInterviewRoundsByJobOpeningParams) {
  return useQuery({
    queryKey: INTERVIEW_ROUNDS_QUERY_KEYS.byJobOpening(params),
    queryFn: () => interviewRoundsService.listByJobOpening(params),
    enabled: !!params?.job_opening_id,
  });
}

export function useCreateInterviewRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInterviewRoundPayload) => interviewRoundsService.create(payload),
    onSuccess: (_res, payload) => {
      queryClient.invalidateQueries({ queryKey: INTERVIEW_ROUNDS_QUERY_KEYS.all });
      if (payload?.job_opening_id) {
        queryClient.invalidateQueries({
          queryKey: INTERVIEW_ROUNDS_QUERY_KEYS.byJobOpening({
            job_opening_id: payload.job_opening_id,
          }),
        });
      }
    },
  });
}

export function useUpdateInterviewRound(id: string, job_opening_id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInterviewRoundPayload) => interviewRoundsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERVIEW_ROUNDS_QUERY_KEYS.all });
      if (job_opening_id) {
        queryClient.invalidateQueries({
          queryKey: INTERVIEW_ROUNDS_QUERY_KEYS.byJobOpening({ job_opening_id }),
        });
      }
    },
  });
}
