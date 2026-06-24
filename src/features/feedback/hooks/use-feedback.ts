"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { feedbackService } from "@/features/feedback/services/feedback.service";
import { interviewerReviewService } from "@/features/feedback/services/interviewerReview.service";
import type {
  CreateInterviewerReviewPayload,
  ListFeedbackParams,
  SubmitInterviewerReviewPayload,
  UpdateInterviewerReviewPayload,
} from "@/features/feedback/types/feedback.types";

export const FEEDBACK_QUERY_KEYS = {
  all: ["feedback"] as const,
  list: (params: ListFeedbackParams) => ["feedback", "list", params] as const,
  detail: (id: string) => ["feedback", "detail", id] as const,
  session: (id: string) => ["feedback", "session", id] as const,
  questions: (sessionId: string) =>
    ["feedback", "questions", sessionId] as const,
  transcripts: (sessionId: string) =>
    ["feedback", "transcripts", sessionId] as const,
  proctoringRisk: (sessionId: string) =>
    ["feedback", "proctoring-risk", sessionId] as const,
  reviews: (sessionId: string) => ["feedback", "reviews", sessionId] as const,
};

export function useFeedbackList(params: ListFeedbackParams) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.list(params),
    queryFn: () => feedbackService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useFeedback(id: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.detail(id),
    queryFn: () => feedbackService.getById(id),
    enabled: !!id,
  });
}

export function useFeedbackSession(id: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.session(id),
    queryFn: () => feedbackService.getSessionById(id),
    enabled: !!id,
  });
}

export function useFeedbackQuestions(sessionId: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.questions(sessionId),
    queryFn: () => feedbackService.getQuestionsBySession(sessionId),
    enabled: !!sessionId,
    select: (response) =>
      [...response.data].sort((a, b) => a.sequence_number - b.sequence_number),
  });
}

export function useFeedbackTranscripts(sessionId: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.transcripts(sessionId),
    queryFn: () => feedbackService.getTranscriptsBySession(sessionId),
    enabled: !!sessionId,
    select: (response) =>
      [...response.data].sort((a, b) => {
        if (a.sequence_number !== b.sequence_number) {
          return a.sequence_number - b.sequence_number;
        }

        return a.created_at.localeCompare(b.created_at);
      }),
  });
}

export function useProctoringRiskSummary(sessionId: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.proctoringRisk(sessionId),
    queryFn: () => feedbackService.getProctoringRiskSummary(sessionId),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useInterviewerReviews(sessionId: string) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.reviews(sessionId),
    queryFn: () => interviewerReviewService.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateInterviewerReview(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInterviewerReviewPayload) =>
      interviewerReviewService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.reviews(sessionId),
      });
    },
  });
}

export function useUpdateInterviewerReview(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateInterviewerReviewPayload }) =>
      interviewerReviewService.update(args.id, args.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.reviews(sessionId),
      });
    },
  });
}

export function useSubmitInterviewerReview(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; payload: SubmitInterviewerReviewPayload }) =>
      interviewerReviewService.submit(args.id, args.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.reviews(sessionId),
      });
    },
  });
}
